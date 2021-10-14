import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { ConstraintInterface } from './constraint/constraint.interface';
import { JointInterface } from './joint';
import { VmV, VpVxS } from './solver';
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

  private readonly lambdaCache = new Float32Array(this.constraintsCapacity);

  constructor(
    private readonly world: World,
    private readonly bodiesCapacity: number,
    private readonly constraintsCapacity: number
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
    } else {
      VmV(this.accelerations, this.forces, this.invMasses, length);
      VpVxS(this.velocities, this.velocities, this.accelerations, dt, length);
      VpVxS(this.positions, this.positions, this.velocities, dt, length);
    }

    // this.solve(dt);
    this.arraysToBodies();
  }

  solve(dt: number, pushFactor: number) {}

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
