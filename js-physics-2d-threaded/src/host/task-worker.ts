import {
  BodyInterface,
  Events,
  IdManager,
  JointInterface,
  WorldInterface,
  createWorld,
} from 'js-physics-2d';
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
  TaskName,
  fail,
  ok,
  OnTask,
  OffTask,
} from '../tasks';
import { createShape } from '../shape-def';
import { WorkerTask, WorkerTaskResult } from '../task-queue';
import { Loop } from './loop';
import {
  AttributeMask,
  BODY_BUFFER_SAFE_CAPACITY,
  EventMask,
  deserializeBody,
  serializeBody,
  serializeEvents,
} from '../serializing';

import {
  BodyEventCollector,
  CollisionEventCollector,
  EventCollectorInterface,
} from './event-collector';
import { MouseCursor } from './mouse-cursor';

export class TaskWorker {
  private bodiesBuffer: Float32Array;
  private eventsBuffer: Float32Array;
  private world: WorldInterface;
  private bodiesNumber: number = 0;
  private readonly joints = new Map<number, JointInterface>();
  private readonly idManager = new IdManager();
  private readonly loop = new Loop();
  private readonly cursor = new MouseCursor();
  private readonly eventCollectors = new Map<string, EventCollectorInterface>([
    [Events.Awake, new BodyEventCollector(Events.Awake)],
    [Events.FallAsleep, new BodyEventCollector(Events.FallAsleep)],
    [Events.CollisionStart, new CollisionEventCollector(Events.CollisionStart)],
    [Events.Collide, new CollisionEventCollector(Events.Collide)],
    [Events.CollisionEnd, new CollisionEventCollector(Events.CollisionEnd)],
  ]);

  processTask(task: WorkerTask): WorkerTaskResult<WorkerTask> {
    switch (task.name) {
      case TaskName.CreateWorld:
        return this.createWorld(task as CreateWorldTask);

      case TaskName.CreateBody:
        return this.createBody(task as CreateBodyTask);

      case TaskName.DestroyBody:
        return this.destroyBody(task as DestroyBodyTask);

      case TaskName.AddDistanceJoint:
        return this.addDistanceJoint(task as AddDistanceJointTask);

      case TaskName.AddPrismaticJoint:
        return this.addPrismaticJoint(task as AddPrismaticJointTask);

      case TaskName.AddRevoluteJoint:
        return this.addRevoluteJoint(task as AddRevoluteJointTask);

      case TaskName.AddWeldJoint:
        return this.addWeldJoint(task as AddWeldJointTask);

      case TaskName.AddWheelJoint:
        return this.addWheelJoint(task as AddWheelJointTask);

      case TaskName.AddSpring:
        return this.addSpring(task as AddSpringTask);

      case TaskName.AddMouseJoint:
        return this.addMouseJoint(task as AddMouseJointTask);

      case TaskName.AddMotor:
        return this.addMotor(task as AddMotorTask);

      case TaskName.RemoveJoint:
        return this.removeJoint(task as RemoveJointTask);

      case TaskName.AddCollider:
        return this.addCollider(task as AddColliderTask);

      case TaskName.RemoveCollider:
        return this.removeCollider(task as RemoveColliderTask);

      case TaskName.Clear:
        return this.clear(task as ClearTask);

      case TaskName.Return:
        return this.returnBuffer(task as ReturnTask);

      case TaskName.On:
        return this.on(task as OnTask);

      case TaskName.Off:
        return this.off(task as OffTask);

      default:
        return fail(task, new Error('Unknown message'));
    }
  }

  createWorld(task: CreateWorldTask): WorkerTaskResult {
    try {
      this.world = createWorld(task.settings);
      this.bodiesBuffer = new Float32Array(
        task.settings.maxBodiesNumber * BODY_BUFFER_SAFE_CAPACITY
      );
      this.eventsBuffer = new Float32Array(4);
      this.loop.start((dt) => this.step(dt), task.settings.step);

      return ok(task);
    } catch (error) {
      return fail(task, error);
    }
  }

  createBody(task: CreateBodyTask): WorkerTaskResult {
    const body = this.world.createBody(task.bodyDef);

    this.bodiesNumber++;

    return ok(task, body.id);
  }

  destroyBody(task: DestroyBodyTask): WorkerTaskResult {
    this.world.destroyBody(this.world.getBody(task.body.id));

    this.bodiesNumber--;

    return ok(task);
  }

  addDistanceJoint(task: AddDistanceJointTask): WorkerTaskResult {
    const { bodyA, pivotA, bodyB, pivotB, distance } = task;

    const joint = this.world.addDistanceJoint({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      distance,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addPrismaticJoint(task: AddPrismaticJointTask): WorkerTaskResult {
    const {
      bodyA,
      pivotA,
      bodyB,
      pivotB,
      localAxis,
      refAngle,
      minDistance,
      maxDistance,
    } = task;

    const joint = this.world.addPrismaticJoint({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      localAxis,
      refAngle,
      minDistance,
      maxDistance,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addRevoluteJoint(task: AddRevoluteJointTask): WorkerTaskResult {
    const {
      bodyA,
      pivotA,
      bodyB,
      pivotB,
      minAngle,
      maxAngle,
      stiffness,
      damping,
    } = task;

    const joint = this.world.addRevoluteJoint({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      minAngle,
      maxAngle,
      stiffness,
      damping,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addWeldJoint(task: AddWeldJointTask): WorkerTaskResult {
    const { bodyA, pivotA, bodyB, pivotB, refAngle } = task;

    const joint = this.world.addWeldJoint({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      refAngle,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addWheelJoint(task: AddWheelJointTask): WorkerTaskResult {
    const {
      bodyA,
      pivotA,
      bodyB,
      pivotB,
      localAxis,
      minDistance,
      maxDistance,
    } = task;

    const joint = this.world.addWheelJonit({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      localAxis,
      minDistance,
      maxDistance,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addSpring(task: AddSpringTask): WorkerTaskResult {
    const { bodyA, pivotA, bodyB, pivotB, distance, stiffness, extinction } =
      task;

    const joint = this.world.addSpring({
      bodyA: this.world.getBody(bodyA.id),
      pivotA,
      bodyB: this.world.getBody(bodyB.id),
      pivotB,
      distance,
      stiffness,
      extinction,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  addMouseJoint(task: AddMouseJointTask): WorkerTaskResult {
    const { cursor, body, joint, maxForce, stiffness } = task;

    this.cursor.setCursor(cursor[0], cursor[1]);

    const _joint = this.world.addMouseJoint({
      control: this.cursor,
      body: this.world.getBody(body.id),
      joint,
      stiffness,
      maxForce,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, _joint);

    return ok(task, id);
  }

  addMotor(task: AddMotorTask): WorkerTaskResult {
    const { body, speed, torque } = task;

    const joint = this.world.addMotor({
      body: this.world.getBody(body.id),
      speed,
      torque,
    });
    const id = this.idManager.getUniqueId();

    this.joints.set(id, joint);

    return ok(task, id);
  }

  removeJoint(task: RemoveJointTask): WorkerTaskResult {
    if (this.joints.has(task.jointId)) {
      const joint = this.joints.get(task.jointId);

      this.joints.delete(task.jointId);
      this.idManager.releaseId(task.jointId);

      if (joint.bodyA) {
        joint.bodyA.removeJoint(joint);
      }

      if (joint.bodyB) {
        joint.bodyB.removeJoint(joint);
      }

      return ok(task);
    } else {
      return fail(
        task,
        `TaskWorker: Failed to remove joint, joint with id#${task.jointId} not found. `
      );
    }
  }

  addCollider(task: AddColliderTask): WorkerTaskResult {
    const { body, shape, mask, isVirtual } = task;

    this.world.addCollider({
      body: this.world.getBody(body.id),
      shape: createShape(shape),
      mask,
      isVirtual,
    });

    return ok(task);
  }

  removeCollider(task: RemoveColliderTask): WorkerTaskResult {
    const body = this.world.getBody(task.collider.id);

    this.world.removeCollider(body.collider);

    return ok(task);
  }

  clear(task: ClearTask): WorkerTaskResult {
    this.world.clear();
    this.joints.clear();
    this.idManager.reset();

    this.bodiesNumber = 0;

    return ok(task);
  }

  returnBuffer(task: ReturnTask): WorkerTaskResult {
    this.bodiesBuffer = task.bodiesBuffer;
    this.eventsBuffer = task.eventsBuffer;

    this.deserializeBodies(task);
    this.deserializeEvents(task);

    return null;
  }

  on(task: OnTask): WorkerTaskResult {
    const collector = this.eventCollectors.get(task.event);

    if (collector && !collector.listening) {
      collector.listen(this.world);
      this.eventsBuffer = new Float32Array(this.getEventBufferSize());
    }

    return ok(task);
  }

  off(task: OffTask): WorkerTaskResult {
    const collector = this.eventCollectors.get(task.event);

    if (collector && collector.listening) {
      collector.stop();
      this.eventsBuffer = new Float32Array(this.getEventBufferSize());
    }

    return ok(task);
  }

  step(dt: number): void {
    this.resetEvents();

    this.world.step(dt);

    // buffers are not detached and world has bodies for serialization
    if (
      this.bodiesBuffer.byteLength > 0 &&
      this.eventsBuffer.byteLength > 0 &&
      this.bodiesNumber > 0
    ) {
      this.serializeBodies();
      this.serializeEvents();

      self.postMessage(
        new StepMessage(
          this.bodiesBuffer,
          this.eventsBuffer,
          this.world['clock'].frame,
          this.world['clock'].time,
          dt
        ),
        {
          transfer: [this.bodiesBuffer.buffer, this.eventsBuffer.buffer],
        }
      );
    }
  }

  private getEventBufferSize(): number {
    let size = 1;

    for (const [eventName, collector] of this.eventCollectors) {
      if (!collector.listening) {
        continue;
      }

      if (eventName === Events.Awake) {
        size += this.world.settings.maxBodiesNumber + 2;
      }

      if (eventName === Events.FallAsleep) {
        size += this.world.settings.maxBodiesNumber + 2;
      }

      if (eventName === Events.CollisionStart) {
        size += this.world.settings.maxBodiesNumber * 8 + 2;
      }

      if (eventName === Events.Collide) {
        size += this.world.settings.maxBodiesNumber * 8 + 2;
      }

      if (eventName === Events.CollisionEnd) {
        size += this.world.settings.maxBodiesNumber * 8 + 2;
      }
    }

    return size;
  }

  private resetEvents(): void {
    for (const collector of this.eventCollectors.values()) {
      collector.reset();
    }
  }

  private serializeBodies(): void {
    let offset = 0;

    this.bodiesBuffer[offset++] = this.bodiesNumber;

    for (const body of this.world) {
      offset += serializeBody(
        this.bodiesBuffer,
        offset,
        body,
        AttributeMask.All
      );
    }
  }

  private serializeEvents(): void {
    let offset = 0;

    this.eventsBuffer[offset++] = this.eventCollectors.size;

    for (const collector of this.eventCollectors.values()) {
      offset += serializeEvents(this.eventsBuffer, offset, collector);
    }
  }

  private deserializeBodies(message: ReturnTask): void {
    let offset = 0;
    const bodiesNumber = message.bodiesBuffer[offset++];

    for (let i = 0; i < bodiesNumber; i++) {
      const body = this.world.getBody(message.bodiesBuffer[offset + 1]);

      if (body) {
        offset += deserializeBody(body, message.bodiesBuffer, offset);
        body.updateTransform();
      }
    }
  }

  private deserializeEvents(message: ReturnTask): void {
    let offset = 0;
    const collectionsNumber = message.eventsBuffer[offset++];

    for (let i = 0; i < collectionsNumber; i++) {
      const mask = message.eventsBuffer[offset++] as EventMask;

      if (mask & EventMask.Cursor) {
        this.cursor.setCursor(
          message.eventsBuffer[offset++],
          message.eventsBuffer[offset++]
        );
      }
    }
  }
}
