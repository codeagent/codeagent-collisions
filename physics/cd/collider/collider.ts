import { mat3 } from 'gl-matrix';

import { AABBBounded, Shape } from '../shape';

export interface Collider {
  readonly transform: mat3;
  readonly mask: number;
  readonly shape: Shape & AABBBounded;
}
