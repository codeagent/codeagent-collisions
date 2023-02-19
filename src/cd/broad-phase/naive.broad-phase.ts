import { vec2 } from 'gl-matrix';
import { Service } from 'typedi';

import { AABB } from '../aabb';
import { Collider } from '../collider';
import {
  ContactCandidate,
  ContactCandidatePair,
  BroadPhaseInterface,
} from '../types';

@Service()
export class NaiveBroadPhase implements BroadPhaseInterface {
  private readonly colliders: Collider[] = [];

  private readonly capsuleAABB = new AABB();

  private readonly candidatePair: [ContactCandidate, ContactCandidate] = [
    new ContactCandidate(),
    new ContactCandidate(),
  ];

  registerCollider(collider: Collider): void {
    this.colliders.push(collider);
  }

  unregisterCollider(collider: Collider): void {
    this.colliders.splice(this.colliders.indexOf(collider), 1);
  }

  *queryCapsule(
    p0: Readonly<vec2>,
    p1: Readonly<vec2>,
    radius: number
  ): Iterable<Collider> {
    vec2.set(
      this.capsuleAABB.min,
      Math.min(p0[0], p1[0]) - radius,
      Math.min(p0[1], p1[1]) - radius
    );
    vec2.set(
      this.capsuleAABB.max,
      Math.max(p0[0], p1[0]) + radius,
      Math.max(p0[1], p1[1]) + radius
    );

    this.updateAABBs();

    for (const collider of this.colliders) {
      if (
        AABB.testAABB(this.capsuleAABB, collider.aabb) &&
        AABB.testCapsule(collider.aabb, p0, p1, radius)
      ) {
        yield collider;
      }
    }
  }

  *detectCandidates(): Iterable<ContactCandidatePair> {
    this.updateAABBs();

    const n = this.colliders.length - 1;
    const m = this.colliders.length;

    for (let i = 0; i < n; i++) {
      const left = this.colliders[i];

      for (let j = i + 1; j < m; j++) {
        const right = this.colliders[j];

        if (!(left.mask & right.mask)) {
          continue;
        }

        if (left.body.isStatic && right.body.isStatic) {
          continue;
        }

        if (AABB.testAABB(left.aabb, right.aabb)) {
          this.candidatePair[0].collider = left;
          this.candidatePair[0].shape = left.shape;
          this.candidatePair[1].collider = right;
          this.candidatePair[1].shape = right.shape;
          yield this.candidatePair;
        }
      }
    }
  }

  private updateAABBs(): void {
    for (const collider of this.colliders) {
      collider.updateAABB();
    }
  }
}
