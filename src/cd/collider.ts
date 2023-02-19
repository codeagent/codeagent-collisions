import { mat3 } from 'gl-matrix';

import { BodyInterface, Material } from '../dynamics';

import { AABB } from './aabb';
import { Shape, ColliderInterface } from './types';

export class Collider implements ColliderInterface {
  readonly aabb = new AABB();

  constructor(
    readonly body: BodyInterface,
    readonly shape: Shape,
    readonly mask: number,
    readonly virtual: boolean, // this type of collider is not involve in contact resolving, only event will be triggered
    readonly material: Material
  ) {}

  get id(): number {
    return this.body.id;
  }

  get transform(): Readonly<mat3> {
    return this.body.transform;
  }

  updateAABB(): void {
    this.shape.aabb(this.aabb, this.body.transform);
  }
}
