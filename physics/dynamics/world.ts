import { vec2 } from 'gl-matrix';

import { Body } from './body';

import {
  CollisionDetector,
  Shape,
  TestTarget,
  AABBBounded,
  MassDistribution,
  Collider,
  BodyCollider,
  ContactInfo,
} from '../cd';

import {
  releaseId,
  uniqueId,
  Profiler,
  MouseControlInterface,
  Clock,
} from '../utils';
import {
  DistanceJoint,
  JointInterface,
  MouseJoint,
  PrismaticJoint,
  RevoluteJoint,
  SpringJoint,
  WeldJoint,
  WheelJoint,
  MotorJoint,
} from './joint';
import { ContactManager } from './contact-manager';
import { WorldIsland } from './world-island';

export type BodyShape = Shape & TestTarget & AABBBounded & MassDistribution;

export class World {
  public readonly bodies: Body[] = [];
  public readonly collisionDetector = new CollisionDetector();
  public readonly contactManager = new ContactManager();
  public readonly clock = Clock.instance;
  private readonly profiler = Profiler.instance;
  private island = new WorldIsland(this);

  constructor(
    public gravity = vec2.fromValues(0.0, -9.8),
    public pushFactor = 0.6,
    public iterations = 10,
    public friction = 0.5,
    public restitution = 0.5
  ) {}

  createBody(mass: number, intertia: number, position: vec2, angle: number) {
    const body = new Body(uniqueId(), this);
    body.mass = mass;
    body.inertia = intertia;
    body.position = position;
    body.angle = angle;

    this.bodies.push(body);
    body.updateTransform();
    this.island.resize(this.bodies.length);

    return body;
  }

  destroyBody(body: Body) {
    const bodyIndex = this.bodies.indexOf(body);
    if (bodyIndex === -1) {
      return;
    }
    this.bodies.splice(bodyIndex, 1);
    releaseId(body.id);

    if (body.collider) {
      this.removeCollider(body.collider);
    }

    this.island.resize(this.bodies.length);
  }

  simulate(dt: number) {
    this.detectCollisions();
    this.integrate(dt);
    this.updateBodiesTransforms();
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
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
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
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
  }

  addRevoluteJoint(bodyA: Body, jointA: vec2, bodyB: Body, jointB: vec2) {
    const joint = new RevoluteJoint(this, bodyA, jointA, bodyB, jointB);
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
  }

  addWeldJoint(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    refAngle = 0
  ) {
    const joint = new WeldJoint(this, bodyA, jointA, bodyB, jointB, refAngle);
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
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
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
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
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    return joint;
  }

  addMouseJoint(
    control: MouseControlInterface,
    body: Body,
    pos: vec2,
    stiffness: number,
    maxForce: number
  ) {
    const joint = new MouseJoint(this, control, body, pos, stiffness, maxForce);
    body.addJoint(joint);

    return joint;
  }

  addMotor(body: Body, speed: number, torque: number) {
    const joint = new MotorJoint(this, body, speed, torque);
    body.addJoint(joint);

    return joint;
  }

  addCollider(collider: Collider) {
    if (collider instanceof BodyCollider) {
      collider.body.collider = collider;
      this.contactManager.registerCollider(collider);
    }

    this.collisionDetector.registerCollider(collider);
  }

  removeCollider(collider: Collider) {
    this.collisionDetector.unregisterCollider(collider);

    if (collider instanceof BodyCollider) {
      this.contactManager.unregisterCollider(collider);
      collider.body.collider = null;
    }
  }

  removeJoint(joint: JointInterface) {
    if (joint.bodyA) {
      joint.bodyA.removeJoint(joint);
    }

    if (joint.bodyB) {
      joint.bodyB.removeJoint(joint);
    }
  }

  private integrate(dt: number) {
    this.clock.tick(dt);

    this.profiler.begin('World.integrate');

    this.applyGlobalForces();

    for (const island of this.getIslands()) {
      island.integrate(dt);
    }

    this.clearForces();

    this.profiler.end('World.integrate');
  }

  private applyGlobalForces() {
    const weight = vec2.create();
    for (const body of this.bodies) {
      if (body.invMass) {
        vec2.scale(weight, this.gravity, body.mass);
        body.applyForce(weight);
      }
    }
  }

  private clearForces() {
    for (const body of this.bodies) {
      body.clearForces();
    }
  }

  private detectCollisions() {
    this.profiler.begin('World.detectCollisions');

    for (const contactInfo of this.collisionDetector.detectCollisions()) {
      if (
        contactInfo.collider0 instanceof BodyCollider &&
        contactInfo.collider1 instanceof BodyCollider
      ) {
        this.contactManager.addContact(
          contactInfo as ContactInfo<BodyCollider, BodyCollider>
        );
      }
    }

    this.contactManager.validate();

    this.profiler.end('World.detectCollisions');
  }

  private updateBodiesTransforms() {
    this.profiler.begin('World.updateBodiesTransforms');
    this.bodies.forEach((b) => b.updateTransform());
    this.profiler.end('World.updateBodiesTransforms');
  }

  private *getIslands(): Iterable<WorldIsland> {
    const bodies = new Set<Body>();
    const joints = new Set<JointInterface>();
    const contacts = new Set<JointInterface>();
    const stack = new Array<Body>();
    let islandId = 0;

    for (let body of this.bodies) {
      // Skip processed
      if (bodies.has(body)) {
        continue;
      }

      this.island.clear();

      // Depth first dependency traverse
      stack.length = 0;
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
        for (const joint of body.joints) {
          if (joints.has(joint)) {
            continue;
          }

          this.island.addJoint(joint);
          joints.add(joint);

          const second = joint.bodyA === body ? joint.bodyB : joint.bodyA;
          if (second && !bodies.has(second)) {
            stack.push(second);
          }
        }

        // concacts
        for (const contact of body.contacts) {
          if (contacts.has(contact)) {
            continue;
          }

          this.island.addJoint(contact);
          contacts.add(contact);

          const second = contact.bodyA === body ? contact.bodyB : contact.bodyA;
          if (second && !bodies.has(second)) {
            stack.push(second);
          }
        }

        this.island.addBody(body);
        bodies.add(body);
      }

      if (this.island.bodies.length) {
        this.island.setId(islandId++);

        yield this.island;
      }
    }
  }
}
