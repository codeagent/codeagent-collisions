import { mat3, vec2 } from 'gl-matrix';
import { AABB } from '../aabb';
import { Shape, MassDistribution } from './shape.interface';

export class Circle implements Shape, MassDistribution {
  constructor(readonly radius: number) {}

  support(out: vec2, dir: vec2, margin: number = 0.0): vec2 {
    vec2.normalize(out, dir);
    return vec2.scale(out, out, this.radius + margin);
  }

  aabb(out: AABB, transform: mat3): AABB {
    const cx = transform[6];
    const cy = transform[7];
    vec2.set(out[0], cx - this.radius, cy - this.radius);
    vec2.set(out[1], cx + this.radius, cy + this.radius);
    return out;
  }

  testPoint(point: vec2): boolean {
    return vec2.dot(point, point) < this.radius * this.radius;
  }

  inetria(mass: number): number {
    return 0.5 * mass * this.radius * this.radius;
  }
}
