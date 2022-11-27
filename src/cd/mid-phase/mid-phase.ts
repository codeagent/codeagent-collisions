import { Service } from 'typedi';

import { MeshOBBNode } from '../../utils';
import { ContactCandidatePair, ContactCandidate } from '../contact';
import { testAABBOBBTree, testOBBOBBTrees } from './tests';
import { MidPhaseInterface } from './mid-phase.interface';
import { MeshShape } from '../shape';

@Service()
export class MidPhase implements MidPhaseInterface {
  private readonly candidatePair: [ContactCandidate, ContactCandidate] = [
    new ContactCandidate(),
    new ContactCandidate(),
  ];

  *detectCandidates(
    pairs: Iterable<ContactCandidatePair>
  ): Iterable<ContactCandidatePair> {
    for (const pair of pairs) {
      const [left, right] = pair;

      if (left.shape instanceof MeshShape && right.shape instanceof MeshShape) {
        const nodes = new Set<[MeshOBBNode, MeshOBBNode]>();

        if (
          testOBBOBBTrees(
            nodes,
            left.shape.obbTree,
            left.collider.transform,
            right.shape.obbTree,
            right.collider.transform
          )
        ) {
          for (const [leftNode, rightNode] of nodes) {
            this.candidatePair[0].collider = left.collider;
            this.candidatePair[0].shape = leftNode.payload.triangleShape;
            this.candidatePair[1].collider = right.collider;
            this.candidatePair[1].shape = rightNode.payload.triangleShape;

            yield this.candidatePair;
          }
        }
      } else if (left.shape instanceof MeshShape) {
        const nodes = new Set<MeshOBBNode>();

        if (
          testAABBOBBTree(
            nodes,
            right.collider.aabb,
            left.shape.obbTree,
            left.collider.transform
          )
        ) {
          for (const node of nodes) {
            this.candidatePair[0].collider = left.collider;
            this.candidatePair[0].shape = node.payload.triangleShape;
            this.candidatePair[1].collider = right.collider;
            this.candidatePair[1].shape = right.shape;

            yield this.candidatePair;
          }
        }
      } else if (right.shape instanceof MeshShape) {
        const nodes = new Set<MeshOBBNode>();

        if (
          testAABBOBBTree(
            nodes,
            left.collider.aabb,
            right.shape.obbTree,
            right.collider.transform
          )
        ) {
          for (const node of nodes) {
            this.candidatePair[0].collider = left.collider;
            this.candidatePair[0].shape = left.shape;
            this.candidatePair[1].collider = right.collider;
            this.candidatePair[1].shape = node.payload.triangleShape;

            yield this.candidatePair;
          }
        }
      } else {
        yield pair;
      }
    }
  }
}
