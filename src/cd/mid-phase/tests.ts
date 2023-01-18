import { mat3, vec2 } from 'gl-matrix';

import { affineInverse } from '../../math';
import { AABB } from '../aabb';
import { OBB } from '../obb';

/*
 * Test aabb againts obb
 * @param aabb  Axis-aligned bounding box
 * @param obb Oriented bounding box
 * @param transform absolute transform of obb in world space
 * @return intersection test
 */
export const testAABBOBB = (
  aabb: Readonly<AABB>,
  obb: Readonly<OBB>,
  transform: Readonly<mat3>, // obb -> abb
  invTransform: Readonly<mat3> // abb -> obb
) => {
  let points = [
    vec2.fromValues(-obb.extent[0], -obb.extent[1]),
    vec2.fromValues(obb.extent[0], -obb.extent[1]),
    vec2.fromValues(obb.extent[0], obb.extent[1]),
    vec2.fromValues(-obb.extent[0], obb.extent[1]),
  ].map((p) => vec2.transformMat3(p, p, transform));

  if (
    points.every((p) => p[0] < aabb[0][0]) ||
    points.every((p) => p[0] > aabb[1][0]) ||
    points.every((p) => p[1] < aabb[0][1]) ||
    points.every((p) => p[1] > aabb[1][1])
  ) {
    return false;
  }

  points = [
    vec2.fromValues(aabb[0][0], aabb[0][1]),
    vec2.fromValues(aabb[1][0], aabb[0][1]),
    vec2.fromValues(aabb[1][0], aabb[1][1]),
    vec2.fromValues(aabb[0][0], aabb[1][1]),
  ].map((p) => vec2.transformMat3(p, p, invTransform));

  if (
    points.every((p) => p[0] < -obb.extent[0]) ||
    points.every((p) => p[0] > obb.extent[0]) ||
    points.every((p) => p[1] < -obb.extent[1]) ||
    points.every((p) => p[1] > obb.extent[1])
  ) {
    return false;
  }

  return true;
};

export const testOBBOBB = (
  obb0: OBB,
  obb1: OBB,
  firstToSecondTransform: mat3, // obb0 -> obb1
  secondToFirstTransform: mat3 // obb1 -> obb0
) => {
  let points = [
    vec2.fromValues(-obb1.extent[0], -obb1.extent[1]),
    vec2.fromValues(obb1.extent[0], -obb1.extent[1]),
    vec2.fromValues(obb1.extent[0], obb1.extent[1]),
    vec2.fromValues(-obb1.extent[0], obb1.extent[1]),
  ].map((p) => vec2.transformMat3(p, p, secondToFirstTransform));

  if (
    points.every((p) => p[0] < -obb0.extent[0]) ||
    points.every((p) => p[0] > obb0.extent[0]) ||
    points.every((p) => p[1] < -obb0.extent[1]) ||
    points.every((p) => p[1] > obb0.extent[1])
  ) {
    return false;
  }

  points = [
    vec2.fromValues(-obb0.extent[0], -obb0.extent[1]),
    vec2.fromValues(obb0.extent[0], -obb0.extent[1]),
    vec2.fromValues(obb0.extent[0], obb0.extent[1]),
    vec2.fromValues(-obb0.extent[0], obb0.extent[1]),
  ].map((p) => vec2.transformMat3(p, p, firstToSecondTransform));

  if (
    points.every((p) => p[0] < -obb1.extent[0]) ||
    points.every((p) => p[0] > obb1.extent[0]) ||
    points.every((p) => p[1] < -obb1.extent[1]) ||
    points.every((p) => p[1] > obb1.extent[1])
  ) {
    return false;
  }

  return true;
};

export interface OBBNode<T = unknown> {
  obb: OBB;
  children: OBBNode<T>[];
  leaf: boolean;
  payload?: T;
}

export const testAABBOBBTree = (
  candidates: Set<OBBNode>,
  aabb: Readonly<AABB>,
  tree: OBBNode,
  transform: Readonly<mat3>
): boolean => {
  const queue: OBBNode[] = [tree];
  const mapping = mat3.create();
  const invMapping = mat3.create();

  candidates.clear();

  while (queue.length) {
    const node = queue.shift();
    mat3.multiply(mapping, transform, node.obb.transform);
    affineInverse(invMapping, mapping);

    if (testAABBOBB(aabb, node.obb, mapping, invMapping)) {
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

export const area = (obb: OBB) => obb.extent[0] * obb.extent[1] * 4.0;

export const testOBBOBBTrees = (
  candidates: Set<[OBBNode, OBBNode]>,
  tree0: OBBNode,
  transform0: Readonly<mat3>,
  tree1: OBBNode,
  transform1: Readonly<mat3>
): boolean => {
  const firstToSecondBodyTransform = mat3.create();
  affineInverse(firstToSecondBodyTransform, transform1);
  mat3.multiply(
    firstToSecondBodyTransform,
    firstToSecondBodyTransform,
    transform0
  );

  const secondToFirstBodyTransform = mat3.create();
  affineInverse(secondToFirstBodyTransform, firstToSecondBodyTransform);

  const queue: Array<[OBBNode, OBBNode]> = [[tree0, tree1]];
  const firstToSecondTransform = mat3.create();
  const secondToFirstTransform = mat3.create();

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
      testOBBOBB(
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
