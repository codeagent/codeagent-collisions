import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { Body } from './body';
import {
  CollisionDetector,
  Collider,
  ColliderDef,
  ColliderInterface,
} from '../cd';
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
  DistanceJointDef,
  PrismaticJointDef,
  RevoluteJointDef,
  WeldJointDef,
  WheelJointDef,
  SpringDef,
  MouseJointDef,
  MotorDef,
} from './joint';
import { Pair, PairsRegistry } from './pairs-registry';
import { IslandsGeneratorInterface } from './island';

import { Settings } from '../settings';
import { Events } from '../events';
import { BodyDef, BodyInterface } from './body.interface';
import { WorldInterface } from './world.interface';

@Service()
export class World implements WorldInterface {
  private readonly bodies = new Map<number, Body>();
  private readonly bodyForce = vec2.create();

  constructor(
    @Inject('SETTINGS') public readonly settings: Readonly<Settings>,
    @Inject('ISLANDS_GENERATOR')
    private readonly islandGenerator: IslandsGeneratorInterface,
    private readonly registry: PairsRegistry,
    private readonly detector: CollisionDetector,
    private readonly clock: Clock,
    private readonly idManager: IdManager,
    private readonly dispatcher: EventDispatcher
  ) {}

  createBody(bodyDef: BodyDef): BodyInterface {
    if (this.bodies.size === this.settings.maxBodiesNumber) {
      throw new Error(
        `World.createBody: Failed to create body: maximum namber of bodies attained: ${this.settings.maxBodiesNumber}`
      );
    }

    const body = new Body(
      this.idManager.getUniqueId(),
      this,
      bodyDef.isContinuos ?? false
    );
    body.mass = bodyDef.mass ?? 1.0;
    body.inertia = bodyDef?.inertia ?? 1.0;
    body.position = bodyDef.position ?? vec2.create();
    body.angle = bodyDef.angle ?? 0.0;
    body.updateTransform();

    this.bodies.set(body.id, body);

    this.dispatch(Events.BodyCreated, body);

    return body;
  }

  destroyBody(body: BodyInterface): void {
    if (!this.bodies.has(body.id)) {
      return;
    }

    this.bodies.delete(body.id);
    this.idManager.releaseId(body.id);

    if (body.collider) {
      this.removeCollider(body.collider);
    }

    this.dispatch(Events.BodyDestroyed, body);
  }

  getBody(id: number): BodyInterface {
    return this.bodies.get(id);
  }

  addDistanceJoint(jointDef: DistanceJointDef): JointInterface {
    const joint = new DistanceJoint(
      this,
      jointDef.bodyA,
      jointDef.pivotA ?? vec2.create(),
      jointDef.bodyB,
      jointDef.pivotB ?? vec2.create(),
      jointDef.distance
    );
    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addPrismaticJoint(jointDef: PrismaticJointDef): JointInterface {
    const joint = new PrismaticJoint(
      this,
      jointDef.bodyA,
      jointDef.pivotA ?? vec2.create(),
      jointDef.bodyB,
      jointDef.pivotB ?? vec2.create(),
      jointDef.localAxis ?? vec2.fromValues(1.0, 0.0),
      jointDef.refAngle ?? 0,
      jointDef.minDistance ?? 0,
      jointDef.maxDistance ?? Number.POSITIVE_INFINITY
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addRevoluteJoint(jointDef: RevoluteJointDef): JointInterface {
    const joint = new RevoluteJoint(
      this,
      jointDef.bodyA,
      jointDef.pivotA ?? vec2.create(),
      jointDef.bodyB,
      jointDef.pivotB ?? vec2.create(),
      jointDef.minAngle ?? Number.NEGATIVE_INFINITY,
      jointDef.maxAngle ?? Number.POSITIVE_INFINITY,
      jointDef.stiffness ?? 0,
      jointDef.damping ?? 0
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addWeldJoint(jointDef: WeldJointDef): JointInterface {
    const joint = new WeldJoint(
      this,
      jointDef.bodyA,
      jointDef.pivotA ?? vec2.create(),
      jointDef.bodyB,
      jointDef.pivotB ?? vec2.create(),
      jointDef.refAngle ?? 0
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addWheelJonit(jointDef: WheelJointDef): JointInterface {
    const joint = new WheelJoint(
      this,
      jointDef.bodyA,
      jointDef.pivotA ?? vec2.create(),
      jointDef.bodyB,
      jointDef.pivotB ?? vec2.create(),
      jointDef.localAxis ?? vec2.fromValues(1.0, 0.0),
      jointDef.minDistance ?? 0,
      jointDef.maxDistance ?? Number.POSITIVE_INFINITY
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addSpring(springDef: SpringDef): JointInterface {
    const joint = new SpringJoint(
      this,
      springDef.bodyA,
      springDef.pivotA ?? vec2.create(),
      springDef.bodyB,
      springDef.pivotB ?? vec2.create(),
      springDef.distance ?? 0.5,
      springDef.stiffness ?? 1.0,
      springDef.extinction ?? 1.0
    );

    springDef.bodyA.addJoint(joint);
    springDef.bodyB.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addMouseJoint(jointDef: MouseJointDef): JointInterface {
    const joint = new MouseJoint(
      this,
      jointDef.control,
      jointDef.body,
      jointDef.joint,
      jointDef.stiffness ?? 1.0,
      jointDef.maxForce ?? 1.0e4
    );

    jointDef.body.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addMotor(motorDef: MotorDef): JointInterface {
    const joint = new MotorJoint(
      this,
      motorDef.body,
      motorDef.speed,
      motorDef.torque
    );
    motorDef.body.addJoint(joint);

    this.dispatch(Events.JointAdded, joint);

    return joint;
  }

  addCollider(colliderDef: ColliderDef): ColliderInterface {
    const collider = new Collider(
      colliderDef.body,
      colliderDef.shape,
      colliderDef.mask ?? 0xffffffff,
      colliderDef.isVirtual ?? false
    );
    Object.assign(collider.body, { collider });

    this.detector.registerCollider(collider);

    for (const body of this.bodies.values()) {
      if (body.collider && body.collider !== collider) {
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

    return collider;
  }

  removeCollider(collider: ColliderInterface): void {
    this.detector.unregisterCollider(collider as Collider);
    Object.assign(collider.body, { collider: null });

    for (const body of this.bodies.values()) {
      const id = pairId(body.collider.id, collider.id);
      this.registry.unregisterPair(id);
    }

    this.dispatch(Events.ColliderRemoved, collider, collider.body);
  }

  removeJoint(joint: JointInterface): void {
    if (joint.bodyA) {
      joint.bodyA.removeJoint(joint);
    }

    if (joint.bodyB) {
      joint.bodyB.removeJoint(joint);
    }

    this.dispatch(Events.JointRemoved, joint);
  }

  clear(): void {
    for (const body of this.bodies.values()) {
      if (body.collider) {
        this.detector.unregisterCollider(body.collider);
      }
    }

    this.registry.clear();
    this.idManager.reset();
    this.bodies.clear();
  }

  on<T extends Function>(eventName: keyof typeof Events, handler: T): void {
    this.dispatcher.addEventListener(eventName, handler);
  }

  off<T extends Function>(eventName: keyof typeof Events, handler: T): void {
    this.dispatcher.removeEventListener(eventName, handler);
  }

  dispatch(eventName: keyof typeof Events, ...payload: unknown[]): void {
    this.dispatcher.dispatch(eventName, ...payload);
  }

  *[Symbol.iterator](): Iterator<BodyInterface> {
    yield* this.bodies.values();
  }

  private applyGlobalForces() {
    for (const body of this.bodies.values()) {
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
          -this.settings.defaultDamping
        );
      }

      body.force = this.bodyForce;

      if (this.settings.defaultAngularDamping) {
        body.torque -= this.settings.defaultAngularDamping * body.omega;
      }
    }
  }

  step(dt: number) {
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

    for (const body of this.bodies.values()) {
      body.tick(dt);
    }

    this.dispatch(Events.PostStep, this.clock.frame, this.clock.time);
  }

  private clearForces() {
    for (const body of this.bodies.values()) {
      body.clearForces();
    }
  }

  private advance(dt: number) {
    for (const island of this.islandGenerator.generate(this.bodies.values())) {
      if (!island.sleeping) {
        this.dispatch(Events.IslandPreStep, island);
        island.step(dt);
        this.dispatch(Events.IslandPostStep, island);
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
