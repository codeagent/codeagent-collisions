import { vec2 } from 'gl-matrix';
import { BodyDef, Events, MouseControlInterface } from 'js-physics-2d';

import { Settings } from './settings';
import { ShapeDef } from './shape-def';
import { WorkerMessage, WorkerTask, WorkerTaskResult } from './task-queue';
import { IdentityInterface } from './identity';

export enum TaskName {
  CreateWorld = 'CreateWorld',
  CreateBody = 'CreateBody',
  DestroyBody = 'DestroyBody',
  AddDistanceJoint = 'AddDistanceJoint',
  AddPrismaticJoint = 'AddPrismaticJoint',
  AddRevoluteJoint = 'AddRevoluteJoint',
  AddWeldJoint = 'AddWeldJoint',
  AddWheelJoint = 'AddWheelJoint',
  AddSpring = 'AddSpring',
  AddMouseJoint = 'AddMouseJoint',
  AddMotor = 'AddMotor',
  RemoveJoint = 'RemoveJoint',
  AddCollider = 'AddCollider',
  RemoveCollider = 'RemoveCollider',
  UpdateTransform = 'UpdateTransform',
  Clear = 'Clear',
  Return = 'Return',
  On = 'On',
  Off = 'Off',
}

export class CreateWorldTask implements WorkerTask {
  readonly name = TaskName.CreateWorld;
  constructor(public readonly settings: Readonly<Settings>) {}
}

export class CreateBodyTask implements WorkerTask {
  readonly name = TaskName.CreateBody;
  constructor(public readonly bodyDef: Readonly<BodyDef>) {}
}

export class DestroyBodyTask implements WorkerTask {
  readonly name = TaskName.DestroyBody;
  constructor(public readonly body: IdentityInterface) {}
}

export class AddDistanceJointTask implements WorkerTask {
  readonly name = TaskName.AddDistanceJoint;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly distance: number
  ) {}
}

export class AddPrismaticJointTask implements WorkerTask {
  readonly name = TaskName.AddPrismaticJoint;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly localAxis: Readonly<vec2>,
    public readonly refAngle: number,
    public readonly minDistance: number,
    public readonly maxDistance: number
  ) {}
}

export class AddRevoluteJointTask implements WorkerTask {
  readonly name = TaskName.AddRevoluteJoint;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly minAngle: number,
    public readonly maxAngle: number,
    public readonly stiffness: number,
    public readonly damping: number
  ) {}
}

export class AddWeldJointTask implements WorkerTask {
  readonly name = TaskName.AddWeldJoint;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly refAngle: number
  ) {}
}

export class AddWheelJointTask implements WorkerTask {
  readonly name = TaskName.AddWheelJoint;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly localAxis: Readonly<vec2>,
    public readonly minDistance: number,
    public readonly maxDistance: number
  ) {}
}

export class AddSpringTask implements WorkerTask {
  readonly name = TaskName.AddSpring;
  constructor(
    public readonly bodyA: IdentityInterface,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: IdentityInterface,
    public readonly pivotB: Readonly<vec2>,
    public readonly distance: number,
    public readonly stiffness: number,
    public readonly extinction: number
  ) {}
}

export class AddMouseJointTask implements WorkerTask {
  readonly name = TaskName.AddMouseJoint;
  constructor(
    public readonly cursor: Readonly<vec2>,
    public readonly body: IdentityInterface,
    public readonly joint: Readonly<vec2>,
    public readonly stiffness: number,
    public readonly maxForce: number
  ) {}
}

export class AddMotorTask implements WorkerTask {
  readonly name = TaskName.AddMotor;
  constructor(
    public readonly body: IdentityInterface,
    public readonly speed: number,
    public readonly torque: number
  ) {}
}

export class RemoveJointTask implements WorkerTask {
  readonly name = TaskName.RemoveJoint;
  constructor(public readonly jointId: number) {}
}

export class AddColliderTask implements WorkerTask {
  readonly name = TaskName.AddCollider;
  constructor(
    public readonly body: IdentityInterface,
    public readonly shape: ShapeDef,
    public readonly mask: number,
    public readonly isVirtual: boolean
  ) {}
}

export class RemoveColliderTask implements WorkerTask {
  readonly name = TaskName.RemoveCollider;

  constructor(public readonly collider: IdentityInterface) {}
}

export class ClearTask implements WorkerTask {
  readonly name = TaskName.Clear;
}

export class UpdateTransformTask implements WorkerTask {
  readonly name = TaskName.UpdateTransform;
}

export class ReturnTask implements WorkerTask {
  readonly name = TaskName.Return;
  readonly taskId = -1; // synthetic task id
  constructor(
    public readonly bodiesBuffer: Float32Array,
    public readonly eventsBuffer: Float32Array
  ) {}
}

export class OnTask implements WorkerTask {
  readonly name = TaskName.On;
  constructor(public readonly event: keyof typeof Events) {}
}

export class OffTask implements WorkerTask {
  readonly name = TaskName.Off;
  constructor(public readonly event: keyof typeof Events) {}
}

export class StepMessage implements WorkerMessage {
  readonly name = 'Step';
  constructor(
    public readonly bodiesBuffer: Float32Array,
    public readonly eventsBuffer: Float32Array,
    public readonly frame: number,
    public readonly time: number,
    public readonly dt: number
  ) {}
}

export const ok = <T extends WorkerTask>(
  task: T,
  result: unknown = 'ok'
): WorkerTaskResult<T> => {
  return {
    name: `${task.name}Result`,
    timestamp: Date.now(),
    task,
    result,
  };
};

export const fail = <T extends WorkerTask>(
  task: T,
  error: unknown
): WorkerTaskResult<T> => {
  return {
    name: `${task.name}Result`,
    timestamp: Date.now(),
    task,
    error,
  };
};
