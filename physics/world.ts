import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { ConstraintInterface, AngularMotorConstraint } from './constraint';
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
import { IslandsGenerator } from './islands-generator';

export class World {
  public readonly bodies: Body[] = [];
  public readonly bodyShape = new Map<Body, Shape>();
  public readonly bodyJoints = new Map<Body, Set<JointInterface>>();
  public readonly bodyContacts = new Map<Body, Set<JointInterface>>();
  public readonly bodyConstraints = new Map<Body, Set<ConstraintInterface>>();
  public readonly bodyIndex = new Map<Body, number>();

  private readonly collisionDetector: CollisionDetector;
  private readonly islandsGenerator: IslandsGenerator;

  // public readonly islands = new Set<WorldIsland>();

  // "read"/"write" variables
  public positions = new Float32Array(0);
  public velocities = new Float32Array(0);
  public forces = new Float32Array(0);
  public invMasses = new Float32Array(0);

  constructor(
    public gravity = vec2.fromValues(0.0, -9.8),
    public pushFactor = 0.6,
    public iterations = 50,
    public friction = 0.5,
    public restitution = 0.5
  ) {
    this.islandsGenerator = new IslandsGenerator(this);

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
    this.bodyConstraints.set(body, new Set<ConstraintInterface>());
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

    body.updateTransform();

    this.collisionDetector.registerBody(body);
    this.islandsGenerator.resizeIsland(this.bodies.length);

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
    this.bodyConstraints.delete(body);
    this.bodyShape.delete(body);
    this.bodyIndex.delete(body);

    this.islandsGenerator.resizeIsland(this.bodies.length);
  }

  simulate(dt: number) {
    this.applyGlobalForces();
    this.detectCollisions();

    for (const island of this.islandsGenerator.generateIslands()) {
      island.step(dt);
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
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
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
  }

  addRevoluteJoint(bodyA: Body, jointA: vec2, bodyB: Body, jointB: vec2) {
    const joint = new RevoluteJoint(this, bodyA, jointA, bodyB, jointB);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
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
  }

  addMotor(body: Body, speed: number, torque: number) {
    const motor = new AngularMotorConstraint(this, body, speed, torque);
    this.bodyConstraints.get(body).add(motor);
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

    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
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

    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
  }

  removeMotor(motor: ConstraintInterface) {
    for (const [, constraints] of this.bodyConstraints) {
      if (constraints.has(motor)) {
        constraints.delete(motor);
        break;
      }
    }
  }

  removeJoint(joint: JointInterface) {
    this.bodyJoints.get(joint.bodyA).delete(joint);
    this.bodyJoints.get(joint.bodyB).delete(joint);
  }

  private detectCollisions() {
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

      this.bodyContacts.get(this.bodies[contact.bodyAIndex]).add(joint);
      this.bodyContacts.get(this.bodies[contact.bodyBIndex]).add(joint);
    }
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
