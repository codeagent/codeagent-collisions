import { vec2 } from 'gl-matrix';
import {
  BodyDef,
  BodyInterface,
  Collider,
  ColliderDef,
  ColliderInterface,
  DistanceJoint,
  DistanceJointDef,
  EventDispatcher,
  Events,
  JointInterface,
  MotorDef,
  MotorJoint,
  MouseControlInterface,
  MouseJoint,
  MouseJointDef,
  PrismaticJoint,
  PrismaticJointDef,
  RevoluteJoint,
  RevoluteJointDef,
  SpringDef,
  SpringJoint,
  WeldJoint,
  WeldJointDef,
  WheelJoint,
  WheelJointDef,
  WorldInterface,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { BodyProxy } from './body-proxy';

import {
  AddColliderTask,
  AddDistanceJointTask,
  AddMotorTask,
  AddMouseJointTask,
  AddPrismaticJointTask,
  AddRevoluteJointTask,
  AddSpringTask,
  AddWeldJointTask,
  AddWheelJointTask,
  CreateBodyTask,
  CreateWorldTask,
  DestroyBodyTask,
  ClearTask,
  RemoveColliderTask,
  RemoveJointTask,
  ReturnTask,
  StepMessage,
  OnTask,
  OffTask,
} from '../tasks';

import WORKER_SOURCE from './worker-source';
import { Settings } from '../settings';
import { createShapeDef } from '../shape-def';
import {
  TaskQueue,
  WorkerMessage,
  WorkerTask,
  WorkerTaskResult,
  isSuccess,
} from '../task-queue';
import { identity } from '../identity';
import {
  BODY_BUFFER_SAFE_CAPACITY,
  EventMask,
  deserializeBody,
  serializeBody,
} from '../serializing';

@Service()
export class WorldProxy implements WorldInterface {
  private readonly bodies = new Map<number, BodyProxy>();
  private readonly worker: Worker;
  private readonly taskQueue: TaskQueue;
  private readonly attributesBuffer: Float32Array;
  private readonly joints = new Map<JointInterface, number>();
  private mouseControl: MouseControlInterface = null;
  private readonly cursor = vec2.create();

  constructor(
    @Inject('SETTINGS') public readonly settings: Readonly<Settings>,
    private readonly dispatcher: EventDispatcher
  ) {
    this.worker = this.createWorker(settings);
    this.worker.addEventListener('message', (event) => this.onMessage(event));
    this.taskQueue = new TaskQueue(this.worker);
    this.taskQueue.enqueue(new CreateWorldTask(settings));
    this.attributesBuffer = new Float32Array(
      settings.maxBodiesNumber * BODY_BUFFER_SAFE_CAPACITY
    );
  }

  createBody(bodyDef: BodyDef): BodyInterface {
    if (this.bodies.size === this.settings.maxBodiesNumber) {
      throw new Error(
        `World.createBody: Failed to create body: maximum number of bodies attained: ${this.settings.maxBodiesNumber}`
      );
    }

    const body = new BodyProxy(this, bodyDef.isContinuos);
    body.mass = bodyDef.mass ?? 1.0;
    body.inertia = bodyDef?.inertia ?? 1.0;
    body.position = bodyDef.position ?? vec2.create();
    body.angle = bodyDef.angle ?? 0.0;
    body.clearAttributeMask();
    body.updateTransform();

    this.taskQueue.enqueue(
      new CreateBodyTask(bodyDef),
      [],
      (result: WorkerTaskResult<CreateBodyTask, number>) =>
        this.onBodyCreated(result, body)
    );

    return body;
  }

  getBody(id: number): BodyInterface {
    return this.bodies.get(id);
  }

  destroyBody(body: BodyInterface): void {
    if (this.bodies.has(body.id)) {
      this.taskQueue.enqueue(
        new DestroyBodyTask(identity(body)),
        [],
        (task: WorkerTaskResult<DestroyBodyTask, unknown>) =>
          this.onBodyDestroyed(task, body)
      );
    }
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

    this.taskQueue.enqueue(
      new AddDistanceJointTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.distance
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddPrismaticJointTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.localAxis,
        joint.refAngle,
        joint.minDistance,
        joint.maxDistance
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddRevoluteJointTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.minAngle,
        joint.maxAngle,
        joint.stiffness,
        joint.damping
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddWeldJointTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.refAngle
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddWheelJointTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.localAxis,
        joint.minDistance,
        joint.maxDistance
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    jointDef.bodyA.addJoint(joint);
    jointDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddSpringTask(
        identity(joint.bodyA),
        joint.pivotA,
        identity(joint.bodyB),
        joint.pivotB,
        joint.distance,
        joint.stiffness,
        joint.extinction
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    springDef.bodyA.addJoint(joint);
    springDef.bodyB.addJoint(joint);

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

    this.taskQueue.enqueue(
      new AddMouseJointTask(
        jointDef.control.getCursorPosition(vec2.create()),
        identity(joint.bodyA),
        joint.joint,
        joint.stiffness,
        joint.maxForce
      ),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    this.mouseControl = joint.control;

    jointDef.body.addJoint(joint);

    return joint;
  }

  addMotor(motorDef: MotorDef): JointInterface {
    const joint = new MotorJoint(
      this,
      motorDef.body,
      motorDef.speed,
      motorDef.torque
    );

    this.taskQueue.enqueue(
      new AddMotorTask(identity(joint.bodyA), joint.speed, joint.torque),
      [],
      (result: WorkerTaskResult<WorkerTask, number>) =>
        this.onJointAdded(result, joint)
    );

    motorDef.body.addJoint(joint);

    return joint;
  }

  removeJoint(joint: JointInterface): void {
    if (this.joints.has(joint)) {
      this.taskQueue.enqueue(
        new RemoveJointTask(this.joints.get(joint)),
        [],
        (result: WorkerTaskResult<RemoveJointTask, number>) =>
          this.onJointRemoved(result, joint)
      );

      if (joint instanceof MouseJoint) {
        this.mouseControl = null;
      }
    }
  }

  addCollider(colliderDef: ColliderDef): ColliderInterface {
    const collider = new Collider(
      colliderDef.body,
      colliderDef.shape,
      colliderDef.mask ?? 0xffffffff,
      colliderDef.isVirtual ?? false
    );

    this.taskQueue.enqueue(
      new AddColliderTask(
        identity(collider),
        createShapeDef(collider.shape),
        collider.mask,
        collider.virtual
      ),
      [],
      () => {
        this.dispatch(Events.ColliderAdded, collider, collider.body);
      }
    );

    Object.assign(collider.body, { collider });

    return collider;
  }

  removeCollider(collider: ColliderInterface): void {
    this.taskQueue.enqueue(
      new RemoveColliderTask(identity(collider)),
      [],
      () => {
        this.dispatch(Events.ColliderRemoved, collider, collider.body);
      }
    );

    Object.assign(collider.body, { collider: null });
  }

  clear(): void {
    this.taskQueue.enqueue(new ClearTask());
    this.joints.clear();
    this.bodies.clear();
    this.mouseControl = null;
  }

  on<T extends Function>(eventName: keyof typeof Events, handler: T): void {
    if (!this.dispatcher.hasEventListeners(eventName)) {
      this.taskQueue.enqueue(new OnTask(eventName));
    }

    this.dispatcher.addEventListener(eventName, handler);
  }

  off<T extends Function>(eventName: keyof typeof Events, handler: T): void {
    this.dispatcher.removeEventListener(eventName, handler);

    if (!this.dispatcher.hasEventListeners(eventName)) {
      this.taskQueue.enqueue(new OffTask(eventName));
    }
  }

  dispatch(eventName: keyof typeof Events, ...payload: unknown[]): void {
    this.dispatcher.dispatch(eventName, ...payload);
  }

  step(dt: number): void {}

  terminate() {
    this.worker.terminate();
  }

  *[Symbol.iterator](): Iterator<BodyInterface> {
    yield* this.bodies.values();
  }

  private createWorker(settings: Readonly<Settings>): Worker {
    if (settings.workerUrl) {
      return new Worker(settings.workerUrl);
    } else {
      const blob = new Blob([WORKER_SOURCE], {
        type: 'application/javascript',
      });
      const url = URL.createObjectURL(blob);
      return new Worker(url);
    }
  }

  private onMessage(event: MessageEvent<WorkerMessage>): void {
    if (event.data.name === 'Step') {
      return this.onStep(event.data as StepMessage);
    }

    // console.log(event.data['task'].name + ' ok', event.data);
  }

  private onBodyCreated(
    result: WorkerTaskResult<CreateBodyTask, number>,
    body: BodyProxy
  ) {
    if (isSuccess(result)) {
      body.id = result.result;
      this.bodies.set(body.id, body);
      this.dispatch(Events.BodyCreated, body);
    } else {
      console.warn('WorldProxy: Failed to create body: ', result.error);
    }
  }

  private onBodyDestroyed(
    result: WorkerTaskResult<DestroyBodyTask, unknown>,
    body: BodyInterface
  ) {
    if (isSuccess(result)) {
      this.bodies.delete(body.id);

      if (body.collider) {
        this.removeCollider(body.collider);
      }

      this.dispatch(Events.BodyDestroyed, body);
    } else {
      console.warn('WorldProxy: Failed to destroy body: ', result.error);
    }
  }

  private onJointAdded(
    result: WorkerTaskResult<WorkerTask, number>,
    joint: JointInterface
  ) {
    if (isSuccess(result)) {
      this.joints.set(joint, result.result);
      this.dispatch(Events.JointAdded, joint);
    } else {
      console.warn('WorldProxy: Failed to create joint: ', result.error);
    }
  }

  private onJointRemoved(
    result: WorkerTaskResult<RemoveJointTask, number>,
    joint: JointInterface
  ) {
    if (isSuccess(result)) {
      this.joints.delete(joint);

      if (joint.bodyA) {
        joint.bodyA.removeJoint(joint);
      }

      if (joint.bodyB) {
        joint.bodyB.removeJoint(joint);
      }

      this.dispatch(Events.JointRemoved, joint);
    }
  }

  private onStep(message: StepMessage): void {
    const written = this.serializeAttributes();
    this.deserializeBodies(message);
    this.deserializeEvents(message);
    this.copyBuffer(message.bodiesBuffer, this.attributesBuffer, written);
    this.serializeEvents(message);

    this.worker.postMessage(
      new ReturnTask(message.bodiesBuffer, message.eventsBuffer),
      [message.bodiesBuffer.buffer, message.eventsBuffer.buffer]
    );

    this.dispatch(Events.PostStep, message.frame, message.time, message.dt);
  }

  private serializeAttributes(): number {
    let offset = 1;
    let size = 0;

    for (const body of this.bodies.values()) {
      const mask = body.getAttributeMask();

      if (mask) {
        offset += serializeBody(this.attributesBuffer, offset, body, mask);
        size++;
      }
    }

    this.attributesBuffer[0] = size;

    return offset;
  }

  private deserializeBodies(message: StepMessage): void {
    let offset = 0;
    const bodiesNumber = message.bodiesBuffer[offset++];

    for (let i = 0; i < bodiesNumber; i++) {
      const body = this.bodies.get(message.bodiesBuffer[offset + 1]);

      if (body) {
        offset += deserializeBody(body, message.bodiesBuffer, offset);
        body.updateTransform();
        body.clearAttributeMask();
      }
    }
  }

  public serializeEvents(message: StepMessage): void {
    let offset = 0;

    if (this.mouseControl) {
      this.mouseControl.getCursorPosition(this.cursor);

      message.eventsBuffer[offset++] = 1;
      message.eventsBuffer[offset++] = EventMask.Cursor;
      message.eventsBuffer[offset++] = this.cursor[0];
      message.eventsBuffer[offset++] = this.cursor[1];
    } else {
      message.eventsBuffer[offset++] = 0;
    }
  }

  private deserializeEvents(message: StepMessage): void {
    let offset = 0;
    const collectionsNumber = message.eventsBuffer[offset++];

    for (let i = 0; i < collectionsNumber; i++) {
      const collectionMask: EventMask = message.eventsBuffer[offset++];
      const collectionLength = message.eventsBuffer[offset++];
      const eventName = EventMask[collectionMask] as keyof typeof Events;

      if (collectionMask & EventMask.Body) {
        for (let j = 0; j < collectionLength; j++) {
          const body = this.getBody(message.eventsBuffer[offset++]);

          if (body) {
            this.dispatch(eventName, body);
          }
        }
      } else if (collectionMask & EventMask.Collision) {
        for (let j = 0; j < collectionLength; j++) {
          const body0 = this.getBody(message.eventsBuffer[offset++]);
          const body1 = this.getBody(message.eventsBuffer[offset++]);

          if (body0 && body1) {
            this.dispatch(eventName, body0.collider, body1.collider);
          }
        }
      }
    }
  }

  private copyBuffer(
    out: Float32Array,
    buffer: Readonly<Float32Array>,
    length: number
  ): void {
    for (let i = 0; i < length; i++) {
      out[i] = buffer[i];
    }
  }
}
