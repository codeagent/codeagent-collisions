import { vec2 } from 'gl-matrix';

import { Collider } from '../collider';

import { Shape } from './shape.interface';

export class ContactCandidate {
  constructor(
    public collider: Readonly<Collider> = null,
    public shape: Readonly<Shape> = null
  ) {}
}

export type ContactCandidatePair = Readonly<
  [ContactCandidate, ContactCandidate]
>;

export interface ContactInfo {
  collider0: Readonly<Collider>; // left collider
  collider1: Readonly<Collider>; // right collider
  shape0: Shape; // shape in left collider
  shape1: Shape; // shape in right collider
  point0: vec2; // global contact point in left collider
  localPoint0: vec2;
  point1: vec2;
  localPoint1: vec2;
  normal: vec2; // from point0 at point1
  depth: number;
}
