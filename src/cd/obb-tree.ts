import { mat3 } from 'gl-matrix';

import { affineInverse } from '../math';

import { AABB } from './aabb';
import { OBB } from './obb';

export class OBBNode<T = unknown> {
  readonly children: OBBNode<T>[] = [];

  leaf: boolean = false;

  payload?: T;

  constructor(readonly obb: OBB) {}
}

export namespace OBBNode {
  const mapping = mat3.create();
  const invMapping = mat3.create();
  const firstToSecondTransform = mat3.create();
  const secondToFirstTransform = mat3.create();
  const firstToSecondBodyTransform = mat3.create();
  const secondToFirstBodyTransform = mat3.create();

  export const area = (obb: OBB): number => obb.extent[0] * obb.extent[1] * 4.0;

  export const testAABB = (
    candidates: Set<OBBNode>,
    aabb: Readonly<AABB>,
    tree: Readonly<OBBNode>,
    transform: Readonly<mat3>
  ): boolean => {
    const queue: OBBNode[] = [tree];

    candidates.clear();

    while (queue.length) {
      const node = queue.shift();
      mat3.multiply(mapping, transform, node.obb.transform);
      affineInverse(invMapping, mapping);

      if (OBB.testAABB(aabb, node.obb, mapping, invMapping)) {
        if (node.payload) {
          candidates.add(node);
        } else {
          for (const child of node.children) {
            queue.push(child);
          }
        }
      }
    }

    return candidates.size !== 0;
  };

  export const testOBBNode = (
    candidates: Set<[OBBNode, OBBNode]>,
    tree0: Readonly<OBBNode>,
    transform0: Readonly<mat3>,
    tree1: Readonly<OBBNode>,
    transform1: Readonly<mat3>
  ): boolean => {
    affineInverse(firstToSecondBodyTransform, transform1);
    mat3.multiply(
      firstToSecondBodyTransform,
      firstToSecondBodyTransform,
      transform0
    );

    affineInverse(secondToFirstBodyTransform, firstToSecondBodyTransform);

    const queue: Array<[OBBNode, OBBNode]> = [[tree0, tree1]];

    candidates.clear();

    while (queue.length) {
      const [first, second] = queue.shift();

      mat3.multiply(
        firstToSecondTransform,
        firstToSecondBodyTransform,
        first.obb.transform
      );

      mat3.multiply(
        firstToSecondTransform,
        second.obb.invTransform,
        firstToSecondTransform
      );

      affineInverse(secondToFirstTransform, firstToSecondTransform);

      if (
        OBB.testOBB(
          first.obb,
          second.obb,
          firstToSecondTransform,
          secondToFirstTransform
        )
      ) {
        if (!first.leaf && !second.leaf) {
          if (area(first.obb) > area(second.obb)) {
            for (const child of first.children) {
              queue.push([child, second]);
            }
          } else {
            for (const child of second.children) {
              queue.push([first, child]);
            }
          }
        } else if (!first.leaf && second.leaf) {
          for (const child of first.children) {
            queue.push([child, second]);
          }
        } else if (first.leaf && !second.leaf) {
          for (const child of second.children) {
            queue.push([first, child]);
          }
        } else {
          candidates.add([first, second]);
        }
      }
    }

    return candidates.size !== 0;
  };
}
