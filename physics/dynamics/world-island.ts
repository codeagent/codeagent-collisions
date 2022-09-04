import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { ConstraintInterface } from './constraint';
import { Profiler } from '../utils';
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
} from '../math';
import { World } from './world';
import { JointInterface } from './joint';

export class WorldIsland {
  public readonly bodies = new Array<Body>();
  private readonly joints = new Set<JointInterface>();

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
  private bodiesCapacity: number;

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
  private constraintsCapacity = 0;
  private constraintsNumber = 0;

  constructor(private readonly world: World) {
    this.resize(0);
  }

  resize(bodiesCapacity: number) {
    const size = bodiesCapacity * 3;
    this.bodiesCapacity = bodiesCapacity;
    this.positions = new Float32Array(size);
    this.velocities = new Float32Array(size);
    this.forces = new Float32Array(size);
    this.invMasses = new Float32Array(size);
    this.accelerations = new Float32Array(size);
    this.c0Forces = new Float32Array(size);
    this.cvForces = new Float32Array(size);
    this.tmpForces = new Float32Array(size);
    this.tmpVelocities = new Float32Array(size);

    this.bhat = new Float32Array(size);
  }

  setId(id: number) {
    this.id = id;
  }

  addBody(body: Body) {
    body.bodyIndex = this.bodies.length;
    body.islandId = this.id;
    body.islandJacobians.length = 0;
    this.bodies.push(body);
  }

  addJoint(joint: JointInterface) {
    this.joints.add(joint);
    this.constraintsNumber += joint.length;
  }

  clear() {
    this.bodies.length = 0;
    this.constraintsNumber = 0;
    this.joints.clear();
  }

  integrate(dt: number) {
    this.bodiesToArrays();

    const length = this.bodies.length * 3;
    if (this.constraintsNumber > 0) {
      // Resolve
      Profiler.instance.begin('WorldInsland.solve');
      this.solve(this.cvForces, this.c0Forces, dt, this.world.pushFactor);
      Profiler.instance.end('WorldInsland.solve');

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

  private solve(
    outForces0: Float32Array,
    outForces1: Float32Array,
    dt: number,
    pushFactor: number
  ) {
    if (this.constraintsNumber > this.constraintsCapacity) {
      this.constraintsCapacity = this.constraintsNumber;
      this.v0 = new Float32Array(this.constraintsCapacity);
      this.v1 = new Float32Array(this.constraintsCapacity);
      this.cMin = new Float32Array(this.constraintsCapacity);
      this.cMax = new Float32Array(this.constraintsCapacity);
      this.lambdas0 = new Float32Array(this.constraintsCapacity);
      this.lambdas1 = new Float32Array(this.constraintsCapacity);
      this.b = new Float32Array(this.constraintsCapacity);
      this.bt0 = new Float32Array(this.constraintsCapacity);
      this.bt1 = new Float32Array(this.constraintsCapacity);
      this.J = new Float32Array(
        this.bodiesCapacity * 3 * this.constraintsCapacity
      );
    }

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

        const [bodyA, bodyB] = constraint.getBodies();
        if (bodyA && !bodyA.isStatic) {
          bodyA.islandJacobians.push(j);
        }

        if (bodyB && !bodyB.isStatic) {
          bodyB.islandJacobians.push(j);
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
      const [bodyA, bodyB] = constraint.getBodies();

      const ca = bodyA ? bodyA.islandJacobians : [];
      const cb = bodyB ? bodyB.islandJacobians : [];

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

    VmV(this.bhat, this.invMasses, this.forces, n);
    VpVxS(this.bhat, this.bhat, this.velocities, 1.0 / dt, n);
    MxV(this.b, csrJ, this.bhat);

    VxSpVxS(this.bt0, this.v0, 1.0 / dt, this.b, -1.0, this.constraintsNumber);
    VxSpVxS(this.bt1, this.v1, 1.0 / dt, this.b, -1.0, this.constraintsNumber);

    Profiler.instance.begin('WorldInsland.projectedGaussSeidel');
    projectedGaussSeidel(
      this.lambdas0,
      this.lambdas1,
      csrA,
      this.bt0,
      this.bt1,
      this.cMin,
      this.cMax,
      this.world.iterations
    );
    Profiler.instance.end('WorldInsland.projectedGaussSeidel');

    MtxV(outForces0, csrJ, this.lambdas0);
    MtxV(outForces1, csrJ, this.lambdas1);

    for (let j = 0; j < this.constraintsNumber; j++) {
      constraints[j].setCache(0 as 0 | 1, this.lambdas0[j]);
      constraints[j].setCache(1 as 0 | 1, this.lambdas1[j]);
    }
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
}
