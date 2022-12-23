import { mat3, vec2 } from 'gl-matrix';

import { BodyInterface } from '../dynamics';
import { AABB } from './aabb';
import { Shape } from './shape';
import { ColliderInterface } from './collider.interface';

export class Collider implements ColliderInterface {
  get id(): number {
    return this.body.id;
  }

  get transform(): Readonly<mat3> {
    return this.body.transform;
  }

  get aabb(): Readonly<AABB> {
    return this._aabb;
  }

  private readonly _aabb: AABB = [vec2.create(), vec2.create()];

  constructor(
    public readonly body: BodyInterface,
    public readonly shape: Shape,
    public readonly mask: number,
    public readonly virtual: boolean // this type of collider is not involve in contact resolving, only event will be triggered
  ) {}

  updateAABB(): void {
    this.shape.aabb(this._aabb, this.body.transform);
  }
}
