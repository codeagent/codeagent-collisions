import { vec2 } from 'gl-matrix';

import { Body } from '../body';
import { ConstraintInterface } from '../constraint';
import { Profiler } from '../../utils';
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
  projectedGaussSeidel,
} from '../../math';
import { JointInterface } from '../joint';
import { StackAllocator } from './allocator';
import { Settings } from '../../settings';

const v = vec2.create();

export class WorldIsland {
  get sleeping() {
    return this._sleeping;
  }

  get empty() {
    return this.bodies.length === 0;
  }

  private readonly bodies = new Array<Body>();
  private readonly joints = new Set<JointInterface>();
  private readonly allocator: StackAllocator;

  private id: number = -1;
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
  private constraintsNumber = 0;
  private _sleeping = true;

  constructor(private readonly settings: Settings) {
    this.allocator = new StackAllocator(settings.islandReservedMemory);
  }

  setId(id: number) {
    this.id = id;
  }

  addBody(body: Body) {
    body.bodyIndex = this.bodies.length;
    body.islandId = this.id;
    body.islandJacobians.length = 0;
    this._sleeping = this._sleeping && body.isSleeping;
    this.bodies.push(body);
  }

  addJoint(joint: JointInterface) {
    this.joints.add(joint);
    this.constraintsNumber += joint.length;
  }

  clear() {
    this.bodies.length = 0;
    this.constraintsNumber = 0;
    this._sleeping = true;
    this.joints.clear();
  }

  step(dt: number) {
    this.allocate();
    this.bodiesToArrays();

    if (this.constraintsNumber > 0) {
      // Resolve
      Profiler.instance.begin('WorldInsland.solve');
      this.solve(
        this.cvForces,
        this.c0Forces,
        dt,
        this.settings.defaultPushFactor
      );
      Profiler.instance.end('WorldInsland.solve');

      //  Correct positions
      VpV(this.tmpForces, this.forces, this.cvForces);
      VcV(this.tmpVelocities, this.velocities);
      VmV(this.accelerations, this.tmpForces, this.invMasses);
      VpVxS(this.tmpVelocities, this.tmpVelocities, this.accelerations, dt);
      VpVxS(this.positions, this.positions, this.tmpVelocities, dt);

      // Correct velocities
      VpV(this.tmpForces, this.forces, this.c0Forces);
      VmV(this.accelerations, this.tmpForces, this.invMasses);
      VpVxS(this.velocities, this.velocities, this.accelerations, dt);
    } else {
      VmV(this.accelerations, this.forces, this.invMasses);
      VpVxS(this.velocities, this.velocities, this.accelerations, dt);
      VpVxS(this.positions, this.positions, this.velocities, dt);
    }

    this.arraysToBodies();
    this.deallocate();
  }

  private solve(
    outForces0: Float32Array,
    outForces1: Float32Array,
    dt: number,
    pushFactor: number
  ) {
    this.J.fill(0);

    Profiler.instance.begin('WorldInsland.getJacobian');
    const n = this.bodies.length * 3;
    let j = 0;
    let i = 0;

    const constraints = new Array<ConstraintInterface>(this.constraintsNumber);
    for (const joint of this.joints) {
      for (const constraint of joint) {
        constraint.getJacobian(this.J, i, n);
        const { min, max } = constraint.getClamping();
        this.cMin[j] = min;
        this.cMax[j] = max;
        this.v0[j] = constraint.getPushFactor(dt, pushFactor);
        this.v1[j] = constraint.getPushFactor(dt, 0);
        this.lambdas0[j] = constraint.getCache(0);
        this.lambdas1[j] = constraint.getCache(1);

        if (constraint.bodyA && !constraint.bodyA.isStatic) {
          constraint.bodyA.islandJacobians.push(j);
        }

        if (constraint.bodyB && !constraint.bodyB.isStatic) {
          constraint.bodyB.islandJacobians.push(j);
        }

        constraints[j] = constraint;
        i += n;
        j++;
      }
    }

    Profiler.instance.end('WorldInsland.getJacobian');

    Profiler.instance.begin('WorldInsland.lookup');
    const lookup = new Array<number[]>(this.constraintsNumber);
    let k = 0;
    for (const constraint of constraints) {
      const ca = constraint.bodyA ? constraint.bodyA.islandJacobians : [];
      const cb = constraint.bodyB ? constraint.bodyB.islandJacobians : [];

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
      lookup[k++] = queue;
    }
    Profiler.instance.end('WorldInsland.lookup');

    // A = J * Minv * Jt
    // b = 1.0 / ∆t * v − J * (1 / ∆t * v1 + Minv * fext)

    Profiler.instance.begin('WorldInsland.compress');
    const csrJ = compress(this.J, this.constraintsNumber, n);
    Profiler.instance.end('WorldInsland.compress');

    Profiler.instance.begin('WorldInsland.MxDxMtCsr');
    const csrA = MxDxMt(csrJ, this.invMasses, lookup);
    Profiler.instance.end('WorldInsland.MxDxMtCsr');

    VmV(this.bhat, this.invMasses, this.forces);
    VpVxS(this.bhat, this.bhat, this.velocities, 1.0 / dt);
    MxV(this.b, csrJ, this.bhat);

    VxSpVxS(this.bt0, this.v0, 1.0 / dt, this.b, -1.0);
    VxSpVxS(this.bt1, this.v1, 1.0 / dt, this.b, -1.0);

    Profiler.instance.begin('WorldInsland.projectedGaussSeidel');
    projectedGaussSeidel(
      this.lambdas0,
      this.lambdas1,
      csrA,
      this.bt0,
      this.bt1,
      this.cMin,
      this.cMax,
      this.settings.solverIterations
    );
    Profiler.instance.end('WorldInsland.projectedGaussSeidel');

    MtxV(outForces0, csrJ, this.lambdas0);
    MtxV(outForces1, csrJ, this.lambdas1);

    for (let j = 0; j < this.constraintsNumber; j++) {
      constraints[j].setCache(0 as 0 | 1, this.lambdas0[j]);
      constraints[j].setCache(1 as 0 | 1, this.lambdas1[j]);
    }
  }

  private allocate() {
    const bodiesArraySize = 3 * this.bodies.length;

    this.positions = this.allocator.allocate(bodiesArraySize);
    this.velocities = this.allocator.allocate(bodiesArraySize);
    this.forces = this.allocator.allocate(bodiesArraySize);
    this.invMasses = this.allocator.allocate(bodiesArraySize);
    this.accelerations = this.allocator.allocate(bodiesArraySize);

    if (this.constraintsNumber > 0) {
      this.c0Forces = this.allocator.allocate(bodiesArraySize);
      this.cvForces = this.allocator.allocate(bodiesArraySize);
      this.tmpForces = this.allocator.allocate(bodiesArraySize);
      this.tmpVelocities = this.allocator.allocate(bodiesArraySize);
      this.bhat = this.allocator.allocate(bodiesArraySize);

      this.v0 = this.allocator.allocate(this.constraintsNumber);
      this.v1 = this.allocator.allocate(this.constraintsNumber);
      this.cMin = this.allocator.allocate(this.constraintsNumber);
      this.cMax = this.allocator.allocate(this.constraintsNumber);
      this.lambdas0 = this.allocator.allocate(this.constraintsNumber);
      this.lambdas1 = this.allocator.allocate(this.constraintsNumber);
      this.b = this.allocator.allocate(this.constraintsNumber);
      this.bt0 = this.allocator.allocate(this.constraintsNumber);
      this.bt1 = this.allocator.allocate(this.constraintsNumber);
      this.J = this.allocator.allocate(
        this.constraintsNumber * this.bodies.length * 3
      );
    }
  }

  private deallocate() {
    this.allocator.clear();
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

      body.updateTransform();
    }
  }
}
