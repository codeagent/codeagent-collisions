import { Inject, Service } from 'typedi';

import {
  VcV,
  VmV,
  VpV,
  VpVxS,
  VxSpVxS,
  MtxV,
  MxV,
  MxDxMt,
  LinearEquationsSolverInterface,
  Matrix,
} from '../math';
import { Settings } from '../settings';
import { Memory, Stack } from '../utils';

import { Body } from './body';
import { ConstraintsSolverInterface, ConstraintInterface } from './types';

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

  private J: Matrix = {
    columns: [],
    rows: [],
    values: [],
    m: 0,
    n: 0,
  };

  private jacobian = new Float32Array(6);

  private lookup: Array<number[]> = [];

  private constraints: Readonly<ConstraintInterface>[];

  private stack: Stack;

  private rows: number;

  private columns: number;

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('LINEAR_EQUATIONS_SOLVER')
    private readonly linearEquationsSolver: LinearEquationsSolverInterface,
    private readonly memory: Memory
  ) {
    this.stack = new Stack(
      this.memory.reserve(
        this.getRequiredMemorySize(
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
    this.createJacobianMatrix(constraints, dt);
    this.createConstraintLookup(constraints);
    this.solveConstraintForces(this.cvForces, this.c0Forces, dt);
    this.correctPositions(outPositions, dt);
    this.correctVelocities(outVelocities, dt);
    this.deallocate();
  }

  private allocate(rows: number, columns: number): void {
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

      body.solverConstraints.length = 0;
    }
  }

  private createJacobianMatrix(
    constraints: Readonly<ConstraintInterface>[],
    dt: number
  ): void {
    this.J.m = this.rows;
    this.J.n = this.columns;
    this.J.columns.length = this.J.rows.length = this.J.values.length = 0;

    let j = 0;
    const values = this.J.values;
    const columns = this.J.columns;
    const rows = this.J.rows;

    for (const constraint of constraints) {
      constraint.getJacobian(this.jacobian);
      const { min, max } = constraint.getClamping();
      this.cMin[j] = min;
      this.cMax[j] = max;
      this.v0[j] = constraint.getPushFactor(
        dt,
        this.settings.constraintPushFactor
      );
      this.v1[j] = constraint.getPushFactor(dt, 0);
      this.lambdas0[j] = constraint.getCache(0);
      this.lambdas1[j] = constraint.getCache(1);

      rows.push(values.length);

      const bodyA = constraint.bodyA as Body;
      const bodyB = constraint.bodyB as Body;

      if (bodyA && !bodyA.isStatic && bodyB && !bodyB.isStatic) {
        bodyA.solverConstraints.push(j);
        bodyB.solverConstraints.push(j);

        if (bodyA.bodyIndex < bodyB.bodyIndex) {
          values.push(
            this.jacobian[0],
            this.jacobian[1],
            this.jacobian[2],
            this.jacobian[3],
            this.jacobian[4],
            this.jacobian[5]
          );
          columns.push(
            bodyA.bodyIndex * 3,
            bodyA.bodyIndex * 3 + 1,
            bodyA.bodyIndex * 3 + 2,
            bodyB.bodyIndex * 3,
            bodyB.bodyIndex * 3 + 1,
            bodyB.bodyIndex * 3 + 2
          );
        } else {
          values.push(
            this.jacobian[3],
            this.jacobian[4],
            this.jacobian[5],
            this.jacobian[0],
            this.jacobian[1],
            this.jacobian[2]
          );
          columns.push(
            bodyB.bodyIndex * 3,
            bodyB.bodyIndex * 3 + 1,
            bodyB.bodyIndex * 3 + 2,
            bodyA.bodyIndex * 3,
            bodyA.bodyIndex * 3 + 1,
            bodyA.bodyIndex * 3 + 2
          );
        }
      } else if (bodyA && !bodyA.isStatic) {
        bodyA.solverConstraints.push(j);
        values.push(this.jacobian[0], this.jacobian[1], this.jacobian[2]);
        columns.push(
          bodyA.bodyIndex * 3,
          bodyA.bodyIndex * 3 + 1,
          bodyA.bodyIndex * 3 + 2
        );
      } else if (bodyB && !bodyB.isStatic) {
        bodyB.solverConstraints.push(j);
        values.push(this.jacobian[3], this.jacobian[4], this.jacobian[5]);
        columns.push(
          bodyB.bodyIndex * 3,
          bodyB.bodyIndex * 3 + 1,
          bodyB.bodyIndex * 3 + 2
        );
      }

      j++;
    }

    rows.push(this.J.values.length);
  }

  private createConstraintLookup(
    constraints: Readonly<ConstraintInterface>[]
  ): void {
    this.lookup.length = this.rows;

    let k = 0;
    for (const constraint of constraints) {
      const bodyA = constraint.bodyA as Body;
      const bodyB = constraint.bodyB as Body;

      const ca = bodyA ? bodyA.solverConstraints : [];
      const cb = bodyB ? bodyB.solverConstraints : [];

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
  ): void {
    // A = J * Minv * Jt
    // b = 1.0 / ∆t * v − J * (1 / ∆t * v1 + Minv * fext)

    const A = MxDxMt(this.J, this.invMasses, this.lookup);

    VmV(this.bhat, this.invMasses, this.forces);
    VpVxS(this.bhat, this.bhat, this.velocities, 1.0 / dt);
    MxV(this.b, this.J, this.bhat);
    VxSpVxS(this.bt0, this.v0, 1.0 / dt, this.b, -1.0);
    VxSpVxS(this.bt1, this.v1, 1.0 / dt, this.b, -1.0);

    // positions
    this.linearEquationsSolver.solve(
      this.lambdas0,
      A,
      this.bt0,
      this.cMin,
      this.cMax
    );

    // velocities
    this.linearEquationsSolver.solve(
      this.lambdas1,
      A,
      this.bt1,
      this.cMin,
      this.cMax
    );

    MtxV(outForces0, this.J, this.lambdas0);
    MtxV(outForces1, this.J, this.lambdas1);

    for (let j = 0; j < this.rows; j++) {
      this.constraints[j].setCache(0, this.lambdas0[j]);
      this.constraints[j].setCache(1, this.lambdas1[j]);
    }
  }

  private correctPositions(outPositions: Float32Array, dt: number): void {
    VpV(this.tmpForces, this.forces, this.cvForces);
    VcV(this.tmpVelocities, this.velocities);
    VmV(this.accelerations, this.tmpForces, this.invMasses);
    VpVxS(this.tmpVelocities, this.tmpVelocities, this.accelerations, dt);
    VpVxS(outPositions, this.positions, this.tmpVelocities, dt);
  }

  private correctVelocities(outVelocities: Float32Array, dt: number): void {
    VpV(this.tmpForces, this.forces, this.c0Forces);
    VmV(this.accelerations, this.tmpForces, this.invMasses);
    VpVxS(outVelocities, this.velocities, this.accelerations, dt);
  }

  private deallocate(): void {
    this.stack.clear();
  }

  private getRequiredMemorySize(
    maxBodies: number,
    maxConstraints: number
  ): number {
    return 120 * maxBodies + 36 * maxConstraints;
  }
}
