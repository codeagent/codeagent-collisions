import { vec2 } from 'gl-matrix';

import { Body } from './body';

import { CollisionDetector, Collider } from '../cd';
import { releaseId, uniqueId, Profiler, Clock, pairId } from '../utils';
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
  MouseControlInterface,
} from './joint';
import { Pair, PairsRegistry } from './pairs-registry';
import { IslandsGeneratorInterface, LocalIslandsGenerator, SoleIslandGenerator } from './island';

export class World {
  public readonly bodies: Body[];
  public readonly registry: PairsRegistry;
  public readonly detector: CollisionDetector;
  public readonly islandGenerator: IslandsGeneratorInterface;

  constructor(
    public gravity = vec2.fromValues(0.0, -9.8),
    public pushFactor = 0.6,
    public iterations = 10,
    public friction = 0.5,
    public restitution = 0.5
  ) {
    this.bodies = [];
    this.registry = new PairsRegistry();
    this.detector = new CollisionDetector(this.registry);
    // this.islandGenerator = new LocalIslandsGenerator(this);
    this.islandGenerator = new SoleIslandGenerator(this);
  }

  createBody(
    mass: number,
    intertia: number,
    position: vec2,
    angle: number,
    continuous = false
  ) {
    const body = new Body(uniqueId(), this, continuous);
    body.mass = mass;
    body.inertia = intertia;
    body.position = position;
    body.angle = angle;

    this.bodies.push(body);
    body.updateTransform();

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
    collider.body.collider = collider;
    this.detector.registerCollider(collider);

    for (const body of this.bodies) {
      if (body.collider !== collider) {
        this.registry.registerPair(new Pair(body.collider, collider));
      }
    }
  }

  removeCollider(collider: Collider) {
    this.detector.unregisterCollider(collider);
    collider.body.collider = null;

    for (const body of this.bodies) {
      const id = pairId(body.collider.id, collider.id);
      this.registry.unregisterPair(id);
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

  private applyGlobalForces() {
    const weight = vec2.create();
    for (const body of this.bodies) {
      if (body.invMass) {
        body.force = vec2.scaleAndAdd(
          weight,
          body.force,
          this.gravity,
          body.mass
        );
      }
    }
  }

  private clearForces() {
    for (const body of this.bodies) {
      body.clearForces();
    }
  }

  // #region ccd

  public step(dt: number) {
    Clock.instance.tick(dt);

    const MAX_ITERATIONS = 8;

    let iterations = MAX_ITERATIONS;
    let span = dt;
    let toi = 0;
    let t = 0;

    this.applyGlobalForces();

    do {
      toi = this.detector.getTimeOfFirstImpact(span); // between [0-1]

      if (toi < 1.0e-6) {
        toi = 1;
      }

      t = span * toi;

      if (iterations === 1) {
        console.log(toi);
      }

      // if (toi < 1) {
      //   debugger;
      // }

      this.detectCollisions();
      this.advance(t);

      span -= t;
    } while (iterations-- && toi < 1);

    this.clearForces();

    for (const body of this.bodies) {
      body.tick(dt);
    }
  }

  private advance(dt: number) {
    for (const island of this.islandGenerator.generate(this.bodies)) {
      if (!island.sleeping) {
        island.step(dt);
      }
    }
  }

  // #endregion

  private detectCollisions() {
    Profiler.instance.begin('World.detectCollisions');

    this.registry.validatePairs();

    for (const contactInfo of this.detector.detectCollisions()) {
      this.registry.addContact(contactInfo);
    }

    Profiler.instance.end('World.detectCollisions');
  }
}
