import { mat3 } from 'gl-matrix';

import { BodyInterface, MaterialDef, Material } from '../dynamics';

import { AABB } from './aabb';
import { Shape } from './shape';

export interface ColliderDef {
  body: BodyInterface;
  shape: Shape;
  mask?: number;
  isVirtual?: boolean;
  material?: MaterialDef;
}

export interface ColliderInterface {
  readonly id: number;
  readonly transform: Readonly<mat3>;
  readonly aabb: Readonly<AABB>;
  readonly body: BodyInterface;
  readonly shape: Shape;
  readonly mask: number;
  readonly virtual: boolean;
  readonly material: Material;
}
