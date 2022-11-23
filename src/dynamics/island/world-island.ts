import { vec2 } from 'gl-matrix';

import { Body } from '../body';
import { ConstraintInterface } from '../constraint';
import { VmV, VpVxS } from '../../math';
import { JointInterface } from '../joint';
import { Settings } from '../../settings';
import { ConstraintsSolverInterface } from '../solver';
import { Memory, Stack } from '../../utils';

export class WorldIsland {
  get sleeping() {
    return this._sleeping;
  }

  get empty() {
    return this.bodies.length === 0;
  }

  private readonly bodies: Body[] = [];
  private readonly constraints: ConstraintInterface[] = [];
  private readonly stack: Stack;

  private id: number = -1;
  private positions: Float32Array;
  private velocities: Float32Array;
  private forces: Float32Array;
  private invMasses: Float32Array;
  private accelerations: Float32Array;
  private _sleeping = true;
  private readonly bodyPosition = vec2.create();
  private readonly bodyVelocity = vec2.create();

  constructor(
    private readonly settings: Settings,
    private readonly solver: ConstraintsSolverInterface,
    private readonly memory: Memory
  ) {
    this.stack = new Stack(
      this.memory.reserve(this.settings.maxBodiesNumber * 60)
    );
  }

  setId(id: number) {
    this.id = id;
  }

  addBody(body: Body) {
    body.bodyIndex = this.bodies.length;
    body.islandId = this.id;
    this._sleeping = this._sleeping && body.isSleeping;
    this.bodies.push(body);
  }

  addJoint(joint: JointInterface) {
    this.constraints.push(...joint);
  }

  clear() {
    this.bodies.length = 0;
    this.constraints.length = 0;
    this._sleeping = true;
  }

  public step(dt: number): void {
    if (this.constraints.length > 0) {
      this.solve(dt);
    } else {
      this.integrate(dt);
    }
  }

  private solve(dt: number): void {
    const arraySize = this.bodies.length * 3;
    this.positions = this.stack.pushFloat32(arraySize);
    this.velocities = this.stack.pushFloat32(arraySize);

    this.solver.solve(
      this.positions,
      this.velocities,
      this.bodies,
      this.constraints,
      dt
    );

    this.arraysToBodies(this.positions, this.velocities);
    this.stack.clear();
  }

  private integrate(dt: number): void {
    const arraySize = this.bodies.length * 3;
    this.positions = this.stack.pushFloat32(arraySize);
    this.velocities = this.stack.pushFloat32(arraySize);
    this.forces = this.stack.pushFloat32(arraySize);
    this.invMasses = this.stack.pushFloat32(arraySize);
    this.accelerations = this.stack.pushFloat32(arraySize);

    this.serializeBodies(this.bodies);

    VmV(this.accelerations, this.forces, this.invMasses);
    VpVxS(this.velocities, this.velocities, this.accelerations, dt);
    VpVxS(this.positions, this.positions, this.velocities, dt);

    this.arraysToBodies(this.positions, this.velocities);
    this.stack.clear();
  }

  private serializeBodies(bodies: Readonly<Body>[]) {
    let i = 0;
    for (const body of bodies) {
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

  private arraysToBodies(positions: Float32Array, velocities: Float32Array) {
    const n = this.bodies.length * 3;

    for (let i = 0, j = 0; i < n; i += 3, j++) {
      const body = this.bodies[j];

      vec2.set(this.bodyPosition, positions[i], positions[i + 1]);
      body.position = this.bodyPosition;
      body.angle = positions[i + 2];

      vec2.set(this.bodyVelocity, velocities[i], velocities[i + 1]);
      body.velocity = this.bodyVelocity;
      body.omega = this.velocities[i + 2];

      body.updateTransform();
    }
  }
}
