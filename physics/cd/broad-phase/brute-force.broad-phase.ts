import { vec2 } from 'gl-matrix';
import { Collider } from '../collider';

import { AABB } from '../aabb';
import { ContactCandidate, ContactCandidatePair } from '../contact';
import { testAABBAABB, testAABBCapsule } from './tests';
import { BroadPhaseInterface } from './broad-phase.interface';

export class BruteForceBroadPhase implements BroadPhaseInterface {
  private readonly colliders: Collider[] = [];
  private readonly colliderAABB = new WeakMap<Collider, AABB>();

  registerCollider(collider: Collider) {
    this.colliders.push(collider);
    this.colliderAABB.set(collider, [vec2.create(), vec2.create()]);
  }

  unregisterCollider(collider: Collider): void {
    this.colliders.splice(this.colliders.indexOf(collider), 1);
    this.colliderAABB.delete(collider);
  }

  *queryCapsule(
    p0: Readonly<vec2>,
    p1: Readonly<vec2>,
    radius: number
  ): Iterable<Collider> {
    const capsuleAABB: AABB = [
      vec2.fromValues(
        Math.min(p0[0], p1[0]) - radius,
        Math.min(p0[1], p1[1]) - radius
      ),
      vec2.fromValues(
        Math.max(p0[0], p1[0]) + radius,
        Math.max(p0[1], p1[1]) + radius
      ),
    ];

    this.updateAABBs();

    for (const collider of this.colliders) {
      const aabb = this.colliderAABB.get(collider);
      if (
        testAABBAABB(capsuleAABB, aabb) &&
        testAABBCapsule(aabb, p0, p1, radius)
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

        const leftShape = leftCollider.shape;
        const rightShape = rightCollider.shape;
        const leftAABB = this.colliderAABB.get(leftCollider);
        const rightAABB = this.colliderAABB.get(rightCollider);

        if (testAABBAABB(leftAABB, rightAABB)) {
          yield [
            new ContactCandidate(leftCollider, leftShape, leftAABB),
            new ContactCandidate(rightCollider, rightShape, rightAABB),
          ];
        }
      }
    }
  }

  private updateAABBs() {
    for (const collider of this.colliders) {
      const aabb = this.colliderAABB.get(collider);
      collider.shape.aabb(aabb, collider.transform);
    }
  }
}
