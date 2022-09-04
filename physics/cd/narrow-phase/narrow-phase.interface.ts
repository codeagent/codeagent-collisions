import { vec2 } from 'gl-matrix';
import { CollisionCandidate } from '../broad-phase';
import { Collider } from '../collider';
import { Shape } from '../shape';

export interface ContactInfo<
  C0 extends Collider = Collider,
  C1 extends Collider = Collider
> {
  collider0: C0; // left collider
  collider1: C1; // right collider
  shape0: Shape; // shape in left collider
  shape1: Shape; // shape in right collider
  point0: vec2; // global contact point in left collider
  localPoint0: vec2;
  point1: vec2;
  localPoint1: vec2;
  normal: vec2; // from point0 at point1
  depth: number;
}

export interface NarrowPhaseInterface {
  detectContacts(
    pairs: [CollisionCandidate, CollisionCandidate][]
  ): ContactInfo[];
}
