import { mat3 } from 'gl-matrix';

import { Body } from '../../dynamics';
import { AABBBounded, Shape } from '../shape';
import { Collider } from './collider';

export class BodyCollider implements Collider {
  get id(): number {
    return this.body.id;
  }

  get transform(): mat3 {
    return this.body.transform;
  }

  constructor(
    public readonly body: Body,
    public readonly shape: Shape & AABBBounded,
    public readonly mask = 0xffffffff
  ) {}
}
