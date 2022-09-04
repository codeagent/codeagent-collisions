import { mat3, vec2 } from 'gl-matrix';
import { AABB } from './aabb';
import {
  AABBBounded,
  Shape,
  TestTarget,
  MassDistribution,
} from './shape.interface';

export class Circle
  implements Shape, AABBBounded, TestTarget, MassDistribution
{
  constructor(readonly radius: number) {}

  support(out: vec2, dir: vec2): vec2 {
    vec2.normalize(out, dir);
    return vec2.scale(out, out, this.radius);
  }

  aabb(out: AABB, transform: mat3): AABB {
    const center = vec2.fromValues(transform[6], transform[7]);
    vec2.set(out[0], center[0] - this.radius, center[1] - this.radius);
    vec2.set(out[1], center[0] + this.radius, center[1] + this.radius);
    return out;
  }

  testPoint(point: vec2): boolean {
    return vec2.dot(point, point) < this.radius * this.radius;
  }

  inetria(mass: number): number {
    return 0.5 * mass * this.radius * this.radius;
  }
}
