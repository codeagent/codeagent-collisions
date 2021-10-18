import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { ConstraintInterface } from './constraint';
import { csr } from './csr';
import { projectedGaussSeidel, VcV, VmV, VpV, VpVxS, VxSpVxS } from './solver';
import { World } from './world';

export class WorldIsland {
  public readonly bodies = new Array<Body>();
  public readonly constraints = Array<ConstraintInterface>();
  private readonly positions = new Float32Array(this.bodiesCapacity * 3);
  private readonly velocities = new Float32Array(this.bodiesCapacity * 3);
  private readonly forces = new Float32Array(this.bodiesCapacity * 3);
  private readonly invMasses = new Float32Array(this.bodiesCapacity * 3);
  private readonly accelerations = new Float32Array(this.bodiesCapacity * 3);
  private readonly c0Forces = new Float32Array(this.bodiesCapacity * 3);
  private readonly cvForces = new Float32Array(this.bodiesCapacity * 3);
  private readonly tmpForces = new Float32Array(this.bodiesCapacity * 3);
  private readonly tmpVelocities = new Float32Array(this.bodiesCapacity * 3);

  constructor(
    private readonly world: World,
    private readonly bodiesCapacity: number
  ) {}

  addBody(body: Body) {
    this.bodies.push(body);
  }

  addConstraint(constraint: ConstraintInterface) {
    this.constraints.push(constraint);
  }

  clear() {
    this.bodies.length = 0;
    this.constraints.length = 0;
  }

  integrate(dt: number) {
    this.world.bodyIndex.clear();
    this.bodies.forEach((body, index) => this.world.bodyIndex.set(body, index));

    this.bodiesToArrays();
    this.applyGlobalForces();

    const length = this.bodies.length * 3;
    if (this.constraints.length) {
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

    this.clearForces();
    this.arraysToBodies();
  }

  private solve(out: Float32Array, dt: number, pushFactor: number) {
    const n = this.bodies.length * 3;
    const c = this.constraints.length;

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
    let written = 0;
    const rows: number[] = [written];
    const columns: number[] = [];
    const values: number[] = [];

    for (const constraint of this.constraints) {
      written += constraint.getJacobian(values, columns);
      rows.push(written);

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

    // const csrJ = csr.compress(J, c);
    const csrJ = {
      m: c,
      n: n,
      values: Float32Array.from(values),
      columns: Uint16Array.from(columns),
      rows: Uint16Array.from(rows),
    };

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
      this.constraints[i].setCache(cacheId, lambdas[i]);
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

      vec2.set(v, this.forces[i], this.forces[i + 1]);
      body.force = v;
      body.torque = this.forces[i + 2];
    }
  }

  private applyGlobalForces() {
    for (let i = 0, length = this.forces.length; i < length; i += 3) {
      if (this.invMasses[i]) {
        const mass = 1.0 / this.invMasses[i];
        this.forces[i] += mass * this.world.gravity[0];
        this.forces[i + 1] += mass * this.world.gravity[1];
      }
    }
  }

  private clearForces() {
    this.forces.fill(0.0);
  }
}
