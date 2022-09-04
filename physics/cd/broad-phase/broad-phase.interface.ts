import { Collider } from '../collider';
import { Shape } from '../shape';

export interface CollisionCandidate {
  collider: Collider;
  shape: Shape;
}

export interface BroadPhaseInterface {
  registerCollider(collider: Collider): void;
  unregisterCollider(collider: Collider): void;
  detectCandidates(): [CollisionCandidate, CollisionCandidate][];
}
