import { vec2 } from 'gl-matrix';

import { SpaceMappingInterface } from '../../../math';
import { Convex } from '../../types';

const support0 = vec2.create();
const support1 = vec2.create();
const opposite = vec2.create();

export const support = (
  support: vec2,
  shape0: Readonly<Convex>,
  shape1: Readonly<Convex>,
  spaceMapping: Readonly<SpaceMappingInterface>,
  dir: Readonly<vec2>,
  margin: number
): vec2 => {
  spaceMapping.toFirstVector(opposite, dir);
  shape0.support(support0, opposite, margin);
  spaceMapping.fromFirstPoint(support0, support0);

  vec2.negate(opposite, dir);
  spaceMapping.toSecondVector(opposite, opposite);
  shape1.support(support1, opposite, margin);
  spaceMapping.fromSecondPoint(support1, support1);

  return vec2.subtract(support, support0, support1);
};
