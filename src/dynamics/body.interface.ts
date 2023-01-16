import { mat3, vec2 } from 'gl-matrix';

import { JointInterface } from './joint';
import { ColliderInterface } from '../cd';
import { WorldInterface } from './world.interface';

export interface BodyDef {
  mass?: number;
  inertia?: number;
  position?: Readonly<vec2>;
  angle?: number;
  isContinuos?: boolean;
}

export interface BodyInterface {
  readonly id: number;
  readonly world: WorldInterface;
  islandId: number;
  readonly transform: Readonly<mat3>;
  readonly invTransform: Readonly<mat3>;
  position: Readonly<vec2>;
  angle: number;
  velocity: Readonly<vec2>;
  omega: number;
  force: Readonly<vec2>;
  torque: number;
  mass: number;
  readonly invMass: number;
  inertia: number;
  readonly invInertia: number;
  readonly isStatic: boolean;
  isSleeping: boolean;
  readonly collider: ColliderInterface;
  readonly continuous: boolean;
  readonly joints: Set<Readonly<JointInterface>>;
  addJoint(joint: JointInterface): void;
  removeJoint(joint: JointInterface): void;
  updateTransform(): void;
  applyForce(force: Readonly<vec2>, point?: Readonly<vec2>): void;
  clearForces(): void;
  toLocalPoint(out: vec2, global: Readonly<vec2>): vec2;
  toGlobalPoint(out: vec2, local: Readonly<vec2>): vec2;
}
