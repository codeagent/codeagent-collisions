import { mat3 } from 'gl-matrix';
import { AABBBounded, Shape } from '../shape';
import { Collider } from './collider';

export class StaticCollider implements Collider {
  constructor(
    public readonly transform: mat3,
    public readonly shape: Shape & AABBBounded,
    public readonly mask = 0xffffffff
  ) {}
}
