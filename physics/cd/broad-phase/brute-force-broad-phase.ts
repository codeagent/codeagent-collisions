import { vec2 } from 'gl-matrix';
import { Collider } from '../collider';

import { AABB, MeshOBBNode, MeshShape } from '../shape';
import {
  BroadPhaseInterface,
  CollisionCandidate,
} from './broad-phase.interface';
import { testAABBAABB, testAABBOBBTree, testOBBOBBTrees } from './tests';

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

  detectCandidates(): [CollisionCandidate, CollisionCandidate][] {
    // Update aabb-s
    for (const collider of this.colliders) {
      const aabb = this.colliderAABB.get(collider);
      collider.shape.aabb(aabb, collider.transform);
    }

    // find candidates
    const candidates: [CollisionCandidate, CollisionCandidate][] = [];
    for (let i = 0; i < this.colliders.length - 1; i++) {
      for (let j = i + 1; j < this.colliders.length; j++) {
        const leftCollider = this.colliders[i];
        const rightCollider = this.colliders[j];

        const leftShape = leftCollider.shape;
        const rightShape = rightCollider.shape;
        const leftAABB = this.colliderAABB.get(leftCollider);
        const rightAABB = this.colliderAABB.get(rightCollider);

        if (leftShape instanceof MeshShape && rightShape instanceof MeshShape) {
          const nodes = new Set<[MeshOBBNode, MeshOBBNode]>();
          if (
            testOBBOBBTrees(
              nodes,
              leftShape.obbTree,
              leftCollider.transform,
              rightShape.obbTree,
              rightCollider.transform
            )
          ) {
            for (const [left, right] of nodes) {
              candidates.push([
                {
                  collider: rightCollider,
                  shape: right.payload.triangleShape,
                },
                {
                  collider: leftCollider,
                  shape: left.payload.triangleShape,
                },
              ]);
            }
          }
        } else if (leftShape instanceof MeshShape) {
          const nodes = new Set<MeshOBBNode>();
          if (
            testAABBOBBTree(
              nodes,
              rightAABB,
              leftShape.obbTree,
              leftCollider.transform
            )
          ) {
            for (const node of nodes) {
              candidates.push([
                {
                  collider: leftCollider,
                  shape: node.payload.triangleShape,
                },
                { collider: rightCollider, shape: rightShape },
              ]);
            }
          }
        } else if (rightShape instanceof MeshShape) {
          const nodes = new Set<MeshOBBNode>();
          if (
            testAABBOBBTree(
              nodes,
              leftAABB,
              rightShape.obbTree,
              rightCollider.transform
            )
          ) {
            for (const node of nodes) {
              candidates.push([
                {
                  collider: rightCollider,
                  shape: node.payload.triangleShape,
                },
                { collider: leftCollider, shape: leftShape },
              ]);
            }
          }
        } else {
          if (testAABBAABB(leftAABB, rightAABB)) {
            candidates.push([
              { collider: leftCollider, shape: leftShape },
              { collider: rightCollider, shape: rightShape },
            ]);
          }
        }
      }
    }

    return candidates;
  }
}
