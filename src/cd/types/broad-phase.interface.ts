import { vec2 } from 'gl-matrix';

import { Collider } from '../collider';

import { ContactCandidatePair } from './contact';

export interface BroadPhaseInterface {
  registerCollider(collider: Collider): void;
  unregisterCollider(collider: Collider): void;
  detectCandidates(): Iterable<ContactCandidatePair>;
  queryCapsule(
    p0: Readonly<vec2>,
    p1: Readonly<vec2>,
    radius: number
  ): Iterable<Collider>;
}
