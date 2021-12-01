import { vec2 } from 'gl-matrix';

import { Body } from './body';

export interface MouseControlInterface {
  readonly cursor: vec2;
  readonly body: Body | null;
}
