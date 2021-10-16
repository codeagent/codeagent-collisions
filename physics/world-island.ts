import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { ConstraintInterface } from './constraint/constraint.interface';
import { csr } from './csr';
import { JointInterface } from './joint';
import { projectedGaussSeidel, VcV, VmV, VpV, VpVxS, VxSpVxS } from './solver';
import { World } from './world';

export class WorldIsland {
  public readonly bodies = new Array<Body>();
  public readonly joints = new Array<JointInterface>();
  public readonly contacts = new Array<JointInterface>();
  public readonly motors = new Array<ConstraintInterface>();

  private readonly positions = new Float32Array(this.bodiesCapacity * 3);
  private readonly velocities = new Float32Array(this.bodiesCapacity * 3);
  private readonly forces = new Float32Array(this.bodiesCapacity * 3);
  private readonly invMasses = new Float32Array(this.bodiesCapacity * 3);
  private readonly accelerations = new Float32Array(this.bodiesCapacity * 3);
  private readonly c0Forces = new Float32Array(this.bodiesCapacity * 3);
  private readonly cvForces = new Float32Array(this.bodiesCapacity * 3);
  private readonly tmpForces = new Float32Array(this.bodiesCapacity * 3);
  private readonly tmpVelocities = new Float32Array(this.bodiesCapacity * 3);

  // private readonly lambdaCache = new Float32Array(this.constraintsCapacity);

  constructor(
    private readonly world: World,
    private readonly bodiesCapacity: number
  ) {}

  addBody(body: Body) {
    this.bodies.push(body);
  }

  addJoint(joint: JointInterface) {
    this.joints.push(joint);
  }

  addContact(contact: JointInterface) {
    this.contacts.push(contact);
  }

  addMotor(motor: ConstraintInterface) {
    this.motors.push(motor);
  }

  clear() {
    this.bodies.length = 0;
    this.joints.length = 0;
    this.contacts.length = 0;
    this.motors.length = 0;
  }

  step(dt: number) {
    this.bodiesToArrays();
    const length = this.bodies.length * 3;

    if (this.joints.length || this.contacts.length || this.motors.length) {
      // Resolve
      this.solve(this.cvForces, dt, this.world.pushFactor);
      this.solve(this.c0Forces, dt, 0.0);

      //  Correct positions
      VpV(this.tmpForces, this.forces, this.cvForces, length);
      VcV(this.tmpVelocities, this.velocities);
      VmV(this.accelerations, this.tmpForces, this.invMasses, length);
      VpVxS(
        this.tmpVelocities,
        this.tmpVelocities,
        this.accelerations,
        dt,
        length
      );
      VpVxS(this.positions, this.positions, this.tmpVelocities, dt, length);

      // Correct velocities
      VpV(this.tmpForces, this.forces, this.c0Forces, length);
      VmV(this.accelerations, this.tmpForces, this.invMasses, length);
      VpVxS(this.velocities, this.velocities, this.accelerations, dt, length);
    } else {
      VmV(this.accelerations, this.forces, this.invMasses, length);
      VpVxS(this.velocities, this.velocities, this.accelerations, dt, length);
      VpVxS(this.positions, this.positions, this.velocities, dt, length);
    }

    this.arraysToBodies();
  }

  private solve(out: Float32Array, dt: number, pushFactor: number) {
    let constraints: ConstraintInterface[] = [];
    for (let joint of this.joints) {
      constraints = constraints.concat(joint.getConstraints());
    }

    for (let motor of this.motors) {
      constraints = constraints.concat(motor);
    }

    for (let contact of this.contacts) {
      constraints = constraints.concat(contact.getConstraints());
    }

    const n = this.bodies.length * 3;
    const c = constraints.length;

    const J = new Float32Array(n * c);
    const v = new Float32Array(c);
    const cMin = new Float32Array(c);
    const cMax = new Float32Array(c);
    // const A = new Float32Array(c * c);
    const lambdas = new Float32Array(c);
    const b = new Float32Array(c);
    const bhat = new Float32Array(n);
    const cacheId = pushFactor ? 0 : 1;
    const initialGuess = new Float32Array(c);

    let i = 0;
    let j = 0;

    for (const constraint of constraints) {
      J.set(constraint.getJacobian(), i);
      v[j] = constraint.getPushFactor(dt, pushFactor);
      const { min, max } = constraint.getClamping();
      cMin[j] = min;
      cMax[j] = max;
      initialGuess[j] = constraint.getCache(cacheId);
      i += n;
      j++;
    }

    // A = J * Minv * Jt
    // b = 1.0 / ∆t * v − J * (1 / ∆t * v1 + Minv * fext)

    const csrJ = csr.compress(J, c);

    const csrA = csr.MxDxMtCsr(csrJ, this.invMasses);
    // csr.MxDxMt(A, csrJ, this.invMasses);
    // const csrA = csr.compress(A, c)

    VmV(bhat, this.invMasses, this.forces, bhat.length);
    VpVxS(bhat, bhat, this.velocities, 1.0 / dt, bhat.length);
    csr.MxV(b, csrJ, bhat);
    VxSpVxS(b, v, 1.0 / dt, b, -1.0, c);

    projectedGaussSeidel(
      lambdas,
      csrA,
      b,
      initialGuess,
      cMin,
      cMax,
      this.world.iterations
    );

    for (let i = 0; i < c; i++) {
      constraints[i].setCache(cacheId, lambdas[i]);
    }

    csr.MtxV(out, csrJ, lambdas);
  }

  private bodiesToArrays() {
    let i = 0;
    for (const body of this.bodies) {
      const position = body.position;
      const velocity = body.velocity;
      const force = body.force;

      this.positions[i] = position[0];
      this.positions[i + 1] = position[1];
      this.positions[i + 2] = body.angle;

      this.velocities[i] = velocity[0];
      this.velocities[i + 1] = velocity[1];
      this.velocities[i + 2] = body.omega;

      this.forces[i] = force[0];
      this.forces[i + 1] = force[1];
      this.forces[i + 2] = body.torque;

      this.invMasses[i] = this.invMasses[i + 1] = 1.0 / body.mass;
      this.invMasses[i + 2] = 1.0 / body.inertia;

      i += 3;
    }
  }

  private arraysToBodies() {
    const n = this.bodies.length * 3;
    const v = vec2.create();

    for (let i = 0; i < n; i += 3) {
      const body = this.bodies[Math.trunc(i / 3)];

      vec2.set(v, this.positions[i], this.positions[i + 1]);
      body.position = v;
      body.angle = this.positions[i + 2];

      vec2.set(v, this.velocities[i], this.velocities[i + 1]);
      body.velocity = v;
      body.omega = this.velocities[i + 2];
    }
  }
}
