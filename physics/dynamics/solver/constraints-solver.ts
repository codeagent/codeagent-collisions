import { Inject, Service } from 'typedi';

import { Settings } from '../../settings';
import { Body } from '../body';
import { ConstraintInterface } from '../constraint';
import { ConstraintsSolverInterface } from './constraints-solver.interface';

import {
  VcV,
  VmV,
  VpV,
  VpVxS,
  VxSpVxS,
  compress,
  MtxV,
  MxV,
  MxDxMt,
  LinearEquationsSolverInterface,
} from '../../math';

import { Memory, Stack } from '../../utils';
import { LINEAR_EQUATIONS_SOLVER, SETTINGS } from '../../di';

@Service()
export class ConstraintsSolver implements ConstraintsSolverInterface {
  private positions: Float32Array;
  private velocities: Float32Array;
  private forces: Float32Array;
  private invMasses: Float32Array;
  private accelerations: Float32Array;
  private c0Forces: Float32Array;
  private cvForces: Float32Array;
  private tmpForces: Float32Array;
  private tmpVelocities: Float32Array;
  private v0: Float32Array;
  private v1: Float32Array;
  private cMin: Float32Array;
  private cMax: Float32Array;
  private lambdas0: Float32Array;
  private lambdas1: Float32Array;
  private b: Float32Array;
  private bt0: Float32Array;
  private bt1: Float32Array;
  private bhat: Float32Array;
  private J: Float32Array;

  private lookup: Array<number[]> = [];
  private constraints: Readonly<ConstraintInterface>[];
  private stack: Stack;
  private rows: number;
  private columns: number;

  constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(LINEAR_EQUATIONS_SOLVER)
    private readonly linearEquationsSolver: LinearEquationsSolverInterface,
    private readonly memory: Memory
  ) {
    this.stack = new Stack(
      this.memory.reserve(
        this.calcRequiredMemorySize(
          this.settings.maxBodiesNumber,
          this.settings.maxConstraintsNumber
        )
      )
    );
  }

  solve(
    outPositions: Float32Array,
    outVelocities: Float32Array,
    bodies: Readonly<Body>[],
    constraints: Readonly<ConstraintInterface>[],
    dt: number
  ): void {
    this.constraints = constraints;

    this.allocate(constraints.length, bodies.length * 3);
    this.serializeBodies(bodies);
    this.serializeConstraints(constraints, dt);
    this.solveConstraintForces(this.cvForces, this.c0Forces, dt);
    this.correctPositions(outPositions, dt);
    this.correctVelocities(outVelocities, dt);
    this.deallocate();
  }

  private allocate(rows: number, columns: number) {
    this.rows = rows;
    this.columns = columns;
    this.positions = this.stack.pushFloat32(columns);
    this.velocities = this.stack.pushFloat32(columns);
    this.forces = this.stack.pushFloat32(columns);
    this.invMasses = this.stack.pushFloat32(columns);
    this.accelerations = this.stack.pushFloat32(columns);
    this.c0Forces = this.stack.pushFloat32(columns);
    this.cvForces = this.stack.pushFloat32(columns);
    this.tmpForces = this.stack.pushFloat32(columns);
    this.tmpVelocities = this.stack.pushFloat32(columns);
    this.bhat = this.stack.pushFloat32(columns);
    this.v0 = this.stack.pushFloat32(rows);
    this.v1 = this.stack.pushFloat32(rows);
    this.cMin = this.stack.pushFloat32(rows);
    this.cMax = this.stack.pushFloat32(rows);
    this.lambdas0 = this.stack.pushFloat32(rows);
    this.lambdas1 = this.stack.pushFloat32(rows);
    this.b = this.stack.pushFloat32(rows);
    this.bt0 = this.stack.pushFloat32(rows);
    this.bt1 = this.stack.pushFloat32(rows);
    this.J = this.stack.pushFloat32(rows * columns);
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

      body.solverConstraints.length = 0;
    }
  }

  private serializeConstraints(
    constraints: Readonly<ConstraintInterface>[],
    dt: number
  ) {
    this.J.fill(0);

    let j = 0;
    let i = 0;
    for (const constraint of constraints) {
      constraint.getJacobian(this.J, i, this.columns);
      const { min, max } = constraint.getClamping();
      this.cMin[j] = min;
      this.cMax[j] = max;
      this.v0[j] = constraint.getPushFactor(
        dt,
        this.settings.defaultPushFactor
      );
      this.v1[j] = constraint.getPushFactor(dt, 0);
      this.lambdas0[j] = constraint.getCache(0);
      this.lambdas1[j] = constraint.getCache(1);

      if (constraint.bodyA && !constraint.bodyA.isStatic) {
        constraint.bodyA.solverConstraints.push(j);
      }

      if (constraint.bodyB && !constraint.bodyB.isStatic) {
        constraint.bodyB.solverConstraints.push(j);
      }

      i += this.columns;
      j++;
    }

    this.lookup.length = this.rows;

    let k = 0;
    for (const constraint of constraints) {
      const ca = constraint.bodyA ? constraint.bodyA.solverConstraints : [];
      const cb = constraint.bodyB ? constraint.bodyB.solverConstraints : [];

      let i = 0;
      let j = 0;
      let tip = -1;
      const queue: number[] = [];

      while (i < ca.length || j < cb.length) {
        let val: number;
        if (i === ca.length) {
          val = cb[j++];
        } else if (j === cb.length) {
          val = ca[i++];
        } else {
          if (ca[i] < cb[j]) {
            val = ca[i++];
          } else {
            val = cb[j++];
          }
        }
        if (tip !== val) {
          queue.push(val);
          tip = val;
        }
      }
      this.lookup[k++] = queue;
    }
  }

  private solveConstraintForces(
    outForces0: Float32Array,
    outForces1: Float32Array,
    dt: number
  ) {
    // A = J * Minv * Jt
    // b = 1.0 / ∆t * v − J * (1 / ∆t * v1 + Minv * fext)

    const J = compress(this.J, this.rows, this.columns);
    const A = MxDxMt(J, this.invMasses, this.lookup);

    VmV(this.bhat, this.invMasses, this.forces);
    VpVxS(this.bhat, this.bhat, this.velocities, 1.0 / dt);
    MxV(this.b, J, this.bhat);
    VxSpVxS(this.bt0, this.v0, 1.0 / dt, this.b, -1.0);
    VxSpVxS(this.bt1, this.v1, 1.0 / dt, this.b, -1.0);

    // positions
    this.settings.solverMaxIterations = this.settings.solverPositionIterations;
    this.linearEquationsSolver.solve(
      this.lambdas0,
      A,
      this.bt0,
      this.cMin,
      this.cMax
    );

    // velocities
    this.settings.solverMaxIterations = this.settings.solverVelocityIterations;
    this.linearEquationsSolver.solve(
      this.lambdas1,
      A,
      this.bt1,
      this.cMin,
      this.cMax
    );

    MtxV(outForces0, J, this.lambdas0);
    MtxV(outForces1, J, this.lambdas1);

    for (let j = 0, m = this.constraints.length; j < m; j++) {
      this.constraints[j].setCache(0, this.lambdas0[j]);
      this.constraints[j].setCache(1, this.lambdas1[j]);
    }
  }

  private correctPositions(outPositions: Float32Array, dt: number) {
    VpV(this.tmpForces, this.forces, this.cvForces);
    VcV(this.tmpVelocities, this.velocities);
    VmV(this.accelerations, this.tmpForces, this.invMasses);
    VpVxS(this.tmpVelocities, this.tmpVelocities, this.accelerations, dt);
    VpVxS(outPositions, this.positions, this.tmpVelocities, dt);
  }

  private correctVelocities(outVelocities: Float32Array, dt: number) {
    VpV(this.tmpForces, this.forces, this.c0Forces);
    VmV(this.accelerations, this.tmpForces, this.invMasses);
    VpVxS(outVelocities, this.velocities, this.accelerations, dt);
  }

  private deallocate() {
    this.stack.clear();
  }

  private calcRequiredMemorySize(maxBodies: number, maxConstraints: number) {
    return (
      120 * maxBodies + 36 * maxConstraints + 12 * maxBodies * maxConstraints
    );
  }
}
