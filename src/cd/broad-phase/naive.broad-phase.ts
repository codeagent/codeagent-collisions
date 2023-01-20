import { vec2 } from 'gl-matrix';
import { Service } from 'typedi';

import { AABB } from '../aabb';
import { Collider } from '../collider';
import { ContactCandidate, ContactCandidatePair } from '../contact';

import { BroadPhaseInterface } from './broad-phase.interface';
import { testAABBAABB, testAABBCapsule } from './tests';

@Service()
export class NaiveBroadPhase implements BroadPhaseInterface {
  private readonly colliders: Collider[] = [];

  private readonly capsuleAABB: AABB = [vec2.create(), vec2.create()];

  private readonly candidatePair: [ContactCandidate, ContactCandidate] = [
    new ContactCandidate(),
    new ContactCandidate(),
  ];

  registerCollider(collider: Collider) {
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
      this.capsuleAABB[0],
      Math.min(p0[0], p1[0]) - radius,
      Math.min(p0[1], p1[1]) - radius
    );
    vec2.set(
      this.capsuleAABB[1],
      Math.max(p0[0], p1[0]) + radius,
      Math.max(p0[1], p1[1]) + radius
    );

    this.updateAABBs();

    for (const collider of this.colliders) {
      if (
        testAABBAABB(this.capsuleAABB, collider.aabb) &&
        testAABBCapsule(collider.aabb, p0, p1, radius)
      ) {
        yield collider;
      }
    }
  }

  *detectCandidates(): Iterable<ContactCandidatePair> {
    this.updateAABBs();

    for (let i = 0; i < this.colliders.length - 1; i++) {
      for (let j = i + 1; j < this.colliders.length; j++) {
        const leftCollider = this.colliders[i];
        const rightCollider = this.colliders[j];

        if (!(leftCollider.mask & rightCollider.mask)) {
          continue;
        }

        if (testAABBAABB(leftCollider.aabb, rightCollider.aabb)) {
          this.candidatePair[0].collider = leftCollider;
          this.candidatePair[0].shape = leftCollider.shape;
          this.candidatePair[1].collider = rightCollider;
          this.candidatePair[1].shape = rightCollider.shape;
          yield this.candidatePair;
        }
      }
    }
  }

  private updateAABBs() {
    for (const collider of this.colliders) {
      collider.updateAABB();
    }
  }
}
