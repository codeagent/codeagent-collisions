import { vec2 } from 'gl-matrix';

import { csr } from './csr';
import { Body } from './body';
import { ConstraintInterface, AngularMotorConstraint } from './constraint';
import {
  VxSpVxS,
  projectedGaussSeidel,
  Vector,
  VcV,
  VpV,
  VmV,
  VpVxS,
} from './solver';
import { CollisionDetector } from './detector';
import { Shape } from './collision';
import { releaseId, uniqueId } from './unique-id';

import {
  ContactJoint,
  DistanceJoint,
  JointInterface,
  PrismaticJoint,
  RevoluteJoint,
  SpringJoint,
  WeldJoint,
} from './joint';
import { WheelJoint } from './joint/wheel-joint';
import { WorldIsland } from './world-island';

export class World {
  public readonly bodies: Body[] = [];
  public readonly bodyShape = new Map<Body, Shape>();
  public readonly bodyJoints = new Map<Body, Set<JointInterface>>();
  public readonly bodyContacts = new Map<Body, Set<JointInterface>>();
  public readonly bodyMotors = new Map<Body, Set<ConstraintInterface>>();
  public readonly bodyIndex = new Map<Body, number>();
  public readonly joints = new Set<JointInterface>();
  public readonly contacts = new Set<JointInterface>();
  public readonly motors = new Set<ConstraintInterface>();
  private readonly collisionDetector: CollisionDetector;
  public readonly islands = new Set<WorldIsland>();

  // "read"/"write" variables
  public positions = new Float32Array(0);
  public velocities = new Float32Array(0);
  public forces = new Float32Array(0);
  public invMasses = new Float32Array(0);

  // "helper" variables
  private _accelerations = new Float32Array(0);
  private _c0Forces = new Float32Array(0);
  private _cvForces = new Float32Array(0);
  private _tmpForces = new Float32Array(0);
  private _tmpVelocities = new Float32Array(0);

  private _lambdaCache0 = new Float32Array(0);
  private _lambdaCache1 = new Float32Array(0);

  constructor(
    public gravity = vec2.fromValues(0.0, -9.8),
    public pushFactor = 0.6,
    public iterations = 50,
    public friction = 0.5,
    public restitution = 0.5
  ) {
    this.collisionDetector = new CollisionDetector(this);
    this.collisionDetector.collideEnter$.subscribe(([bodyA, bodyB]) =>
      this.onCollideEnter(bodyA, bodyB)
    );
    this.collisionDetector.collide$.subscribe(([bodyA, bodyB]) =>
      this.onCollide(bodyA, bodyB)
    );
    this.collisionDetector.collideLeave$.subscribe(([bodyA, bodyB]) =>
      this.onCollideLeave(bodyA, bodyB)
    );
  }

  createBody(
    shape: Shape,
    mass: number,
    intertia: number,
    position: vec2,
    angle: number
  ) {
    const bodyIndex = this.bodies.length;
    const body = new Body(this, uniqueId(), bodyIndex);
    this.bodies.push(body);
    this.bodyShape.set(body, shape);
    this.bodyContacts.set(body, new Set<JointInterface>());
    this.bodyJoints.set(body, new Set<JointInterface>());
    this.bodyMotors.set(body, new Set<ConstraintInterface>());
    this.bodyIndex.set(body, bodyIndex);

    const n = this.bodies.length * 3;

    if (this.positions.length < n) {
      const tmp = new Float32Array(this.positions.length + 3);
      tmp.set(this.positions);
      this.positions = tmp;
    }

    if (this.velocities.length < n) {
      const tmp = new Float32Array(this.velocities.length + 3);
      tmp.set(this.velocities);
      this.velocities = tmp;
    }

    if (this.forces.length < n) {
      const tmp = new Float32Array(this.forces.length + 3);
      tmp.set(this.forces);
      this.forces = tmp;
    }

    if (this.invMasses.length < n) {
      const tmp = new Float32Array(this.invMasses.length + 3);
      tmp.set(this.invMasses);
      this.invMasses = tmp;
    }

    this.invMasses[bodyIndex * 3] = 1.0 / mass;
    this.invMasses[bodyIndex * 3 + 1] = 1.0 / mass;
    this.invMasses[bodyIndex * 3 + 2] = 1.0 / intertia;

    this.positions[bodyIndex * 3] = position[0];
    this.positions[bodyIndex * 3 + 1] = position[1];
    this.positions[bodyIndex * 3 + 2] = angle;

    this._accelerations = new Float32Array(n);
    this._c0Forces = new Float32Array(n);
    this._cvForces = new Float32Array(n);
    this._tmpVelocities = new Float32Array(n);
    this._tmpForces = new Float32Array(n);

    body.updateTransform();

    this.collisionDetector.registerBody(body);

    return body;
  }

  destroyBody(body: Body) {
    const bodyIndex = this.bodies.indexOf(body);
    if (bodyIndex === -1) {
      return;
    }
    this.bodies.splice(bodyIndex, 1);
    releaseId(body.id);

    const size = this.bodies.length * 3;
    const newPositions = new Float32Array(size);
    const newVelocities = new Float32Array(size);
    const newForces = new Float32Array(size);
    const newInvMasses = new Float32Array(size);

    this._accelerations = new Float32Array(size);
    this._c0Forces = new Float32Array(size);
    this._cvForces = new Float32Array(size);
    this._tmpForces = new Float32Array(size);
    this._tmpVelocities = new Float32Array(size);

    newPositions.set([
      ...this.positions.subarray(0, bodyIndex * 3),
      ...this.positions.subarray((bodyIndex + 1) * 3),
    ]);
    newVelocities.set([
      ...this.velocities.subarray(0, bodyIndex * 3),
      ...this.velocities.subarray((bodyIndex + 1) * 3),
    ]);
    newForces.set([
      ...this.forces.subarray(0, bodyIndex * 3),
      ...this.forces.subarray((bodyIndex + 1) * 3),
    ]);
    newInvMasses.set([
      ...this.invMasses.subarray(0, bodyIndex * 3),
      ...this.invMasses.subarray((bodyIndex + 1) * 3),
    ]);

    this.positions = newPositions;
    this.velocities = newVelocities;
    this.forces = newForces;
    this.invMasses = newInvMasses;
    this.bodyContacts.delete(body);
    this.bodyJoints.delete(body);
    this.bodyMotors.delete(body);
    this.bodyShape.delete(body);
    this.bodyIndex.delete(body);
  }

  simulate(dt: number) {
    this.applyGlobalForces();
    this.detectCollisions();
    this.generateIslands();

    // for (const island of this.islands) {
    //   island.step(dt);
    // }

    const length = this._cvForces.length;
    if (this.joints.size || this.contacts.size || this.motors.size) {
      // Resolve
      this.solveConstraints(this._cvForces, dt, this.pushFactor);
      this.solveConstraints(this._c0Forces, dt, 0.0);

      //  Correct positions
      VpV(this._tmpForces, this.forces, this._cvForces, length);
      VcV(this._tmpVelocities, this.velocities);
      VmV(this._accelerations, this._tmpForces, this.invMasses, length);
      VpVxS(
        this._tmpVelocities,
        this._tmpVelocities,
        this._accelerations,
        dt,
        length
      );
      VpVxS(this.positions, this.positions, this._tmpVelocities, dt, length);

      // Correct velocities
      VpV(this._tmpForces, this.forces, this._c0Forces, length);
      VmV(this._accelerations, this._tmpForces, this.invMasses, length);
      VpVxS(this.velocities, this.velocities, this._accelerations, dt, length);
    } else {
      VmV(this._accelerations, this.forces, this.invMasses, length);
      VpVxS(this.velocities, this.velocities, this._accelerations, dt, length);
      VpVxS(this.positions, this.positions, this.velocities, dt, length);
    }

    this.updateBodiesTransforms();
    this.clearForces();
  }

  addDistanceJoint(
    bodyA: Body,
    positionA: vec2,
    bodyB: Body,
    positionB: vec2,
    distance: number
  ) {
    const joint = new DistanceJoint(
      this,
      bodyA,
      positionA,
      bodyB,
      positionB,
      distance
    );
    this.joints.add(joint);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  addPrismaticJoint(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    localAxis: vec2,
    refAngle = 0,
    minDistance = 0,
    maxDistance = Number.POSITIVE_INFINITY
  ) {
    const joint = new PrismaticJoint(
      this,
      bodyA,
      jointA,
      bodyB,
      jointB,
      localAxis,
      refAngle,
      minDistance,
      maxDistance
    );
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    this.joints.add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  addRevoluteJoint(bodyA: Body, jointA: vec2, bodyB: Body, jointB: vec2) {
    const joint = new RevoluteJoint(this, bodyA, jointA, bodyB, jointB);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    this.joints.add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  addWeldJoint(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    refAngle = 0
  ) {
    const joint = new WeldJoint(this, bodyA, jointA, bodyB, jointB, refAngle);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    this.joints.add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  addMotor(body: Body, speed: number, torque: number) {
    const motor = new AngularMotorConstraint(this, body, speed, torque);
    this.motors.add(motor);
    this.bodyMotors.get(body).add(motor);
    this._lambdaCache0 = new Float32Array(this._lambdaCache0.length + 1);
    this._lambdaCache1 = new Float32Array(this._lambdaCache1.length + 1);
  }

  addWheelJonit(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    localAxis: vec2,
    minDistance = 0,
    maxDistance = Number.POSITIVE_INFINITY
  ) {
    const joint = new WheelJoint(
      this,
      bodyA,
      jointA,
      bodyB,
      jointB,
      localAxis,
      minDistance,
      maxDistance
    );

    this.joints.add(joint);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  addSpring(
    bodyA: Body,
    positionA: vec2,
    bodyB: Body,
    positionB: vec2,
    distance: number,
    stiffness: number,
    extinction: number
  ) {
    const joint = new SpringJoint(
      this,
      bodyA,
      positionA,
      bodyB,
      positionB,
      distance,
      stiffness,
      extinction
    );
    this.joints.add(joint);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);

    this._lambdaCache0 = new Float32Array(
      joint.size + this._lambdaCache0.length
    );
    this._lambdaCache1 = new Float32Array(
      joint.size + this._lambdaCache1.length
    );
  }

  removeMotor(motor: ConstraintInterface) {
    this.motors.delete(motor);
    this._lambdaCache0 = new Float32Array(this._lambdaCache0.length - 1);
    this._lambdaCache1 = new Float32Array(this._lambdaCache1.length - 1);
  }

  removeJoint(joint: JointInterface) {
    this.joints.delete(joint);
    this.bodyJoints.get(joint.bodyA).delete(joint);
    this.bodyJoints.get(joint.bodyB).delete(joint);

    this._lambdaCache0 = new Float32Array(
      this._lambdaCache0.length - joint.size
    );
    this._lambdaCache1 = new Float32Array(
      this._lambdaCache1.length - joint.size
    );
  }

  private detectCollisions() {
    this.contacts.clear();

    for (const body of this.bodies) {
      this.bodyContacts.get(body).clear();
    }

    for (const contact of this.collisionDetector.detectCollisions()) {
      const joint = new ContactJoint(
        this,
        this.bodies[contact.bodyAIndex],
        this.bodies[contact.bodyBIndex],
        contact.point,
        contact.normal,
        contact.depth,
        this.friction
      );
      this.contacts.add(joint);
      this.bodyContacts.get(this.bodies[contact.bodyAIndex]).add(joint);
      this.bodyContacts.get(this.bodies[contact.bodyBIndex]).add(joint);
    }
  }

  private generateIslands() {
    const bodies = new WeakSet<Body>();
    const joints = new WeakSet<JointInterface>();
    const constraints = new WeakSet<ConstraintInterface>();

    const bodiesCapacity = this.bodies.length;
    // const constraintsCapacity =
    //   this.joints.size * 4 + this.contacts.size * 2 + this.motors.size;

    this.islands.clear();

    for (let body of this.bodies) {
      // Skip processed
      if (bodies.has(body)) {
        continue;
      }

      const island = new WorldIsland(this, bodiesCapacity);

      // Depth first dependency traverse
      const stack: Body[] = [];
      stack.push(body);
      while (stack.length) {
        const body = stack.pop();

        if (bodies.has(body)) {
          continue;
        }

        // Skip static bodies
        if (body.isStatic) {
          bodies.add(body);
          continue;
        }

        // joints
        const bodyJoints = this.bodyJoints.get(body);
        for (const joint of bodyJoints) {
          if (joints.has(joint)) {
            continue;
          }
          island.addJoint(joint);
          joints.add(joint);

          const second = joint.bodyA === body ? joint.bodyB : joint.bodyA;
          if (!bodies.has(second)) {
            stack.push(second);
          }
        }

        // concacts
        const bodyContacts = this.bodyContacts.get(body);
        for (const contact of bodyContacts) {
          if (joints.has(contact)) {
            continue;
          }
          island.addContact(contact);
          joints.add(contact);

          const second = contact.bodyA === body ? contact.bodyB : contact.bodyA;
          if (!bodies.has(second)) {
            stack.push(second);
          }
        }

        // motors
        const bodyMotors = this.bodyMotors.get(body);
        for (const motor of bodyMotors) {
          if (constraints.has(motor)) {
            continue;
          }
          island.addMotor(motor);
          constraints.add(motor);
        }

        island.addBody(body);
        bodies.add(body);
      }

      if (island.bodies.length) {
        this.islands.add(island);
      }
    }
  }

  private solveConstraints(out: Vector, dt: number, pushFactor: number) {
    // WARNING! friction constraints are not involved in position correction

    let constraints = [];
    for (let joint of this.joints) {
      constraints = constraints.concat(joint.getConstraints());
    }
    for (let motor of this.motors) {
      constraints = constraints.concat(motor);
    }
    const cacheSize = constraints.length;
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

    const cache = pushFactor ? this._lambdaCache0 : this._lambdaCache1;
    // const initialGuess = new Float32Array(c);
    // initialGuess.set(cache);

    let i = 0;
    let j = 0;
    for (const constraint of constraints) {
      J.set(constraint.getJacobian(), i);
      v[j] = constraint.getPushFactor(dt, pushFactor);
      const { min, max } = constraint.getClamping();
      cMin[j] = min;
      cMax[j] = max;
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

    projectedGaussSeidel(lambdas, csrA, b, cache, cMin, cMax, this.iterations);
    cache.set(lambdas.subarray(0, cacheSize));
    csr.MtxV(out, csrJ, lambdas);
  }

  private applyGlobalForces() {
    let i = 0;
    while (i < this.forces.length) {
      if (!Number.isFinite(this.bodies[i / 3].mass)) {
        i += 3;
        continue;
      }
      this.forces[i] += this.bodies[i / 3].mass * this.gravity[0];
      this.forces[i + 1] += this.bodies[i / 3].mass * this.gravity[1];
      i += 3;
    }
  }

  private clearForces() {
    this.forces.fill(0.0);
  }

  private updateBodiesTransforms() {
    this.bodies.forEach((b) => b.updateTransform());
  }

  private onCollideEnter(bodyA: Body, bodyB: Body) {
    // attach(
    //   this.bodyGraphNodeLookup.get(bodyA),
    //   this.bodyGraphNodeLookup.get(bodyB)
    // );
  }
  private onCollide(bodyA: Body, bodyB: Body) {
    // console.log('onCollide', bodyA, bodyB);
  }
  private onCollideLeave(bodyA: Body, bodyB: Body) {
    // detach(
    //   this.bodyGraphNodeLookup.get(bodyA),
    //   this.bodyGraphNodeLookup.get(bodyB)
    // );
  }
}
