import { vec2 } from 'gl-matrix';
import { BodyInterface } from 'rb-phys2d';

import {
  BodyEventCollector,
  CollisionEventCollector,
} from './host/event-collector';

export enum EventMask {
  CollisionStart = 0x1,
  Collide = 0x2,
  CollisionEnd = 0x4,
  FallAsleep = 0x8,
  Awake = 0x10,
  BodyCreated = 0x20,
  BodyDestroyed = 0x40,
  ColliderAdded = 0x80,
  ColliderRemoved = 0x100,
  JointAdded = 0x200,
  JointRemoved = 0x400,
  PreStep = 0x800,
  IslandPreStep = 0x1000,
  IslandPostStep = 0x2000,
  PostStep = 0x4000,
  Cursor = 0x8000,
  Collision = CollisionStart | Collide | CollisionEnd,
  Body = BodyDestroyed | BodyCreated | FallAsleep | Awake,
}

export enum AttributeMask {
  Island = 0x1,
  Position = 0x2,
  Angle = 0x4,
  Velocity = 0x8,
  Omega = 0x10,
  Force = 0x20,
  Torque = 0x40,
  Mass = 0x80,
  Inertia = 0x100,
  Flag = 0x200,
  None = 0x0,
  All = Island |
    Position |
    Angle |
    Velocity |
    Omega |
    Force |
    Torque |
    Mass |
    Inertia |
    Flag,
}

export const BODY_BUFFER_SAFE_CAPACITY = 15;

export const serializeBody = (
  buffer: Float32Array,
  offset: number,
  body: Readonly<BodyInterface>,
  mask: AttributeMask
): number => {
  const start = offset;

  buffer[offset++] = mask;
  buffer[offset++] = body.id;

  if (mask & AttributeMask.Island) {
    buffer[offset++] = body.islandId;
  }

  if (mask & AttributeMask.Position) {
    for (const value of body.position) {
      buffer[offset++] = value;
    }
  }

  if (mask & AttributeMask.Angle) {
    buffer[offset++] = body.angle;
  }

  if (mask & AttributeMask.Velocity) {
    for (const value of body.velocity) {
      buffer[offset++] = value;
    }
  }

  if (mask & AttributeMask.Omega) {
    buffer[offset++] = body.omega;
  }

  if (mask & AttributeMask.Force) {
    for (const value of body.force) {
      buffer[offset++] = value;
    }
  }

  if (mask & AttributeMask.Torque) {
    buffer[offset++] = body.torque;
  }

  if (mask & AttributeMask.Mass) {
    buffer[offset++] = body.mass;
  }

  if (mask & AttributeMask.Inertia) {
    buffer[offset++] = body.inertia;
  }

  if (mask & AttributeMask.Flag) {
    buffer[offset++] = Number(body.isSleeping);
  }

  return offset - start;
};

const v = vec2.create();

export const deserializeBody = (
  body: BodyInterface,
  buffer: Readonly<Float32Array>,
  offset: number
): number => {
  const start = offset;
  const mask = buffer[offset++] as AttributeMask;

  offset++; // spot for identifier

  if (mask & AttributeMask.Island) {
    body.islandId = buffer[offset++];
  }

  if (mask & AttributeMask.Position) {
    vec2.set(v, buffer[offset++], buffer[offset++]);
    body.position = v;
  }

  if (mask & AttributeMask.Angle) {
    body.angle = buffer[offset++];
  }

  if (mask & AttributeMask.Velocity) {
    vec2.set(v, buffer[offset++], buffer[offset++]);
    body.velocity = v;
  }

  if (mask & AttributeMask.Omega) {
    body.omega = buffer[offset++];
  }

  if (mask & AttributeMask.Force) {
    vec2.set(v, buffer[offset++], buffer[offset++]);
    body.force = v;
  }

  if (mask & AttributeMask.Torque) {
    body.torque = buffer[offset++];
  }

  if (mask & AttributeMask.Mass) {
    body.mass = buffer[offset++];
  }

  if (mask & AttributeMask.Inertia) {
    body.inertia = buffer[offset++];
  }

  if (mask & AttributeMask.Flag) {
    body.isSleeping = Boolean(buffer[offset++]);
  }

  return offset - start;
};

export const serializeEvents = <T = unknown>(
  buffer: Float32Array,
  offset: number,
  collection: Readonly<Iterable<T>>
) => {
  const start = offset;

  if (collection instanceof BodyEventCollector) {
    buffer[offset++] = EventMask[collection.event];
    buffer[offset++] = 0;

    let size = 0;
    for (const id of collection) {
      buffer[offset++] = id;
      size++;
    }

    buffer[start + 1] = size;
  } else if (collection instanceof CollisionEventCollector) {
    buffer[offset++] = EventMask[collection.event];
    buffer[offset++] = 0;

    let size = 0;
    for (const [left, right] of collection) {
      buffer[offset++] = left;
      buffer[offset++] = right;
      size++;
    }

    buffer[start + 1] = size;
  } else {
    buffer.fill(0);
  }

  return offset - start;
};
