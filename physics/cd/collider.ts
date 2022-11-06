import { mat3 } from 'gl-matrix';

import { Body } from '../dynamics';
import { Shape } from './shape';

export class Collider {
  get id(): number {
    return this.body.id;
  }

  get transform(): Readonly<mat3> {
    return this.body.transform;
  }

  constructor(
    public readonly body: Body,
    public readonly shape: Shape,
    public readonly mask = 0xffffffff
  ) {}
}
