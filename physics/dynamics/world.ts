import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { Body } from './body';
import { CollisionDetector, Collider, ContactInfo } from '../cd';
import { Clock, EventDispatcher, IdManager, pairId } from '../utils';
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
import { IslandsGeneratorInterface } from './island';

import { ISLANDS_GENERATOR, SETTINGS } from '../di';
import { Settings } from '../settings';
import { Events } from '../events';

@Service()
export class World {
  public readonly bodies: Body[] = [];

  private readonly bodyForce = vec2.create();

  constructor(
    @Inject(SETTINGS) public readonly settings: Readonly<Settings>,
    @Inject(ISLANDS_GENERATOR)
    private readonly islandGenerator: IslandsGeneratorInterface,
    private readonly registry: PairsRegistry,
    private readonly detector: CollisionDetector,
    private readonly clock: Clock,
    private readonly idManager: IdManager,
    private readonly dispatcher: EventDispatcher
  ) {
    this.dispatch(Events.WorldCreated, this);
  }

  createBody(
    mass: number,
    intertia: number,
    position: vec2,
    angle: number,
    continuous = false
  ) {
    const body = new Body(this.idManager.getUniqueId(), this, continuous);
    body.mass = mass;
    body.inertia = intertia;
    body.position = position;
    body.angle = angle;

    this.bodies.push(body);
    body.updateTransform();

    this.dispatcher.dispatch(Events.BodyCreated, body);

    return body;
  }

  destroyBody(body: Body) {
    const bodyIndex = this.bodies.indexOf(body);
    if (bodyIndex === -1) {
      return;
    }
    this.bodies.splice(bodyIndex, 1);
    this.idManager.releaseId(body.id);

    if (body.collider) {
      this.removeCollider(body.collider);
    }

    this.dispatch(Events.BodyDestroyed, body);
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

    this.dispatch(Events.JointAdded, joint);

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

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addRevoluteJoint(bodyA: Body, jointA: vec2, bodyB: Body, jointB: vec2) {
    const joint = new RevoluteJoint(this, bodyA, jointA, bodyB, jointB);
    bodyA.addJoint(joint);
    bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

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

    this.dispatch(Events.JointAdded, joint);

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

    this.dispatch(Events.JointAdded, joint);

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

    this.dispatch(Events.JointAdded, joint);

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

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addMotor(body: Body, speed: number, torque: number) {
    const joint = new MotorJoint(this, body, speed, torque);
    body.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addCollider(collider: Collider) {
    collider.body.collider = collider;
    this.detector.registerCollider(collider);

    for (const body of this.bodies) {
      if (body.collider !== collider) {
        this.registry.registerPair(
          new Pair(
            body.collider,
            collider,
            this.settings.contactProximityThreshold
          )
        );
      }
    }

    this.dispatch(Events.ColliderAdded, collider, collider.body);
  }

  removeCollider(collider: Collider) {
    this.detector.unregisterCollider(collider);
    collider.body.collider = null;

    for (const body of this.bodies) {
      const id = pairId(body.collider.id, collider.id);
      this.registry.unregisterPair(id);
    }

    this.dispatch(Events.ColliderRemoved, collider, collider.body);
  }

  removeJoint(joint: JointInterface) {
    if (joint.bodyA) {
      joint.bodyA.removeJoint(joint);
    }

    if (joint.bodyB) {
      joint.bodyB.removeJoint(joint);
    }

    this.dispatch(Events.JointRemoved, joint);
  }

  dispose() {
    this.registry.clear();
    this.idManager.reset();

    for (const body of this.bodies) {
      if (body.collider) {
        this.detector.unregisterCollider(body.collider);
      }
    }

    this.bodies.length = 0;

    this.dispatch(Events.WorldDestroyed, this);
  }

  on<T extends Function>(eventName: keyof typeof Events, handler: T) {
    this.dispatcher.addEventListener(eventName, handler);
  }

  off<T extends Function>(eventName: keyof typeof Events, handler: T) {
    this.dispatcher.removeEventListener(eventName, handler);
  }

  dispatch(eventName: keyof typeof Events, ...payload: unknown[]) {
    this.dispatcher.dispatch(eventName, ...payload);
  }

  private applyGlobalForces() {
    for (const body of this.bodies) {
      vec2.copy(this.bodyForce, body.force);

      if (body.invMass) {
        vec2.scaleAndAdd(
          this.bodyForce,
          this.bodyForce,
          this.settings.gravity,
          body.mass
        );
      }

      if (this.settings.defaultDamping) {
        vec2.scaleAndAdd(
          this.bodyForce,
          this.bodyForce,
          body.velocity,
          -this.settings.defaultDamping * vec2.length(body.velocity)
        );
      }

      body.force = this.bodyForce;

      if (this.settings.defaultAngularDamping) {
        body.torque -=
          this.settings.defaultAngularDamping *
          body.omega *
          body.omega *
          Math.sign(body.omega);
      }
    }
  }

  private clearForces() {
    for (const body of this.bodies) {
      body.clearForces();
    }
  }

  public step(dt: number) {
    this.clock.tick(dt);
    this.dispatch(Events.PreStep, this.clock.frame, this.clock.time);

    let iterations = this.settings.toiSubsteps;
    let span = dt;
    let toi = 0;
    let t = 0;

    this.applyGlobalForces();

    do {
      toi = this.detector.getTimeOfFirstImpact(span); // between [0-1]

      // Corect very small values assuming that there are no impacts
      if (toi < 1.0e-3) {
        toi = 1;
      }

      t = span * toi;

      this.detectCollisions();
      this.advance(t);

      span -= t;
    } while (iterations-- && toi < 1);

    this.clearForces();

    for (const body of this.bodies) {
      body.tick(dt);
    }

    this.dispatch(Events.PostStep, this.clock.frame, this.clock.time);
  }

  private advance(dt: number) {
    for (const island of this.islandGenerator.generate(this.bodies)) {
      if (!island.sleeping) {
        island.step(dt);
        this.dispatch(Events.IslandStep, island);
      }
    }
  }

  private detectCollisions() {
    this.registry.validatePairs();

    for (const contactInfo of this.detector.detectCollisions()) {
      this.registry.addContact(contactInfo);
    }

    this.registry.emitEvents();
  }
}
