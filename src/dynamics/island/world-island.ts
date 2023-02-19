import { vec2 } from 'gl-matrix';

import { VmV, VpVxS } from '../../math';
import { Settings } from '../../settings';
import { Memory, Stack } from '../../utils';
import { Body } from '../body';
import {
  ConstraintInterface,
  JointInterface,
  ConstraintsSolverInterface,
} from '../types';

export class WorldIsland {
  private readonly bodies: Body[] = [];

  private readonly constraints: ConstraintInterface[] = [];

  private readonly stack: Stack;

  private id = -1;

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

  get sleeping(): boolean {
    return this._sleeping;
  }

  get empty(): boolean {
    return this.bodies.length === 0;
  }

  setId(id: number): void {
    this.id = id;
  }

  addBody(body: Body): void {
    body.bodyIndex = this.bodies.length;
    body.islandId = this.id;
    this._sleeping = this._sleeping && body.isSleeping;
    this.bodies.push(body);
  }

  addJoint(joint: JointInterface): void {
    this.constraints.push(...joint);
  }

  clear(): void {
    this.bodies.length = 0;
    this.constraints.length = 0;
    this._sleeping = true;
  }

  step(dt: number): void {
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

  private serializeBodies(bodies: Readonly<Body>[]): void {
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

      this.invMasses[i] = this.invMasses[i + 1] = body.invMass;
      this.invMasses[i + 2] = body.invInertia;

      i += 3;
    }
  }

  private arraysToBodies(
    positions: Float32Array,
    velocities: Float32Array
  ): void {
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
