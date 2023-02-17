import { Service } from 'typedi';

import { MeshOBBNode } from '../mesh';
import { OBBNode } from '../obb-tree';
import { MeshShape } from '../shape';
import { ContactCandidatePair, MidPhaseInterface } from '../types';

@Service()
export class MidPhase implements MidPhaseInterface {
  *detectCandidates(
    pairs: Iterable<ContactCandidatePair>
  ): Iterable<ContactCandidatePair> {
    for (const pair of pairs) {
      const [left, right] = pair;

      if (left.shape instanceof MeshShape && right.shape instanceof MeshShape) {
        const nodes = new Set<[MeshOBBNode, MeshOBBNode]>();

        if (
          OBBNode.testOBBNode(
            nodes,
            left.shape.obbTree,
            left.collider.transform,
            right.shape.obbTree,
            right.collider.transform
          )
        ) {
          for (const [leftNode, rightNode] of nodes) {
            pair[0].shape = leftNode.payload.triangleShape;
            pair[1].shape = rightNode.payload.triangleShape;

            yield pair;
          }
        }
      } else if (left.shape instanceof MeshShape) {
        const nodes = new Set<MeshOBBNode>();

        if (
          OBBNode.testAABB(
            nodes,
            right.collider.aabb,
            left.shape.obbTree,
            left.collider.transform
          )
        ) {
          for (const node of nodes) {
            pair[0].shape = node.payload.triangleShape;

            yield pair;
          }
        }
      } else if (right.shape instanceof MeshShape) {
        const nodes = new Set<MeshOBBNode>();

        if (
          OBBNode.testAABB(
            nodes,
            left.collider.aabb,
            right.shape.obbTree,
            right.collider.transform
          )
        ) {
          for (const node of nodes) {
            pair[1].shape = node.payload.triangleShape;

            yield pair;
          }
        }
      } else {
        yield pair;
      }
    }
  }
}
