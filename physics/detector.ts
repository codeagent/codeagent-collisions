import { vec2 } from 'gl-matrix';

import { Body } from './body';
import { World } from './world';
import {
  sat,
  MTV,
  Polygon,
  Circle,
  ContactManifold,
  getPolyPolyContactManifold,
  getPolyCircleContactManifold,
  getCircleCircleContactManifold,
  SpaceMapping,
  SpaceMappingInterface,
  inverse as inverseSpaceMapping,
  AABB
} from './collision';

export interface BodiesContactPoint {
  bodyAIndex: number;
  bodyBIndex: number;
  point: vec2;
  normal: vec2;
  depth: number;
}

export class CollisionDetector {
  private readonly bodyAABBLookup = new WeakMap<Body, AABB>();

  constructor(private readonly world: World) {}

  registerBody(body: Body) {
    this.bodyAABBLookup.set(body, [vec2.create(), vec2.create()]);
  }

  detectCollisions() {
    this.updateAABBs();
    const candidates = this.broadPhase();
    return this.narrowPhase(candidates);
  }

  private testAABBAABB(aabb1: AABB, aabb2: AABB) {
    return (
      aabb2[0][0] < aabb1[1][0] &&
      aabb2[1][0] > aabb1[0][0] &&
      aabb2[0][1] < aabb1[1][1] &&
      aabb2[1][1] > aabb1[0][1]
    );
  }

  private updateAABBs() {
    for (const body of this.world.bodies) {
      const shape = this.world.bodyShapeLookup.get(body);
      const aabb = this.bodyAABBLookup.get(body);
      shape.aabb(aabb, body.transform);
    }
  }

  private broadPhase(): [number, number][] {
    const candidates = [];
    for (let i = 0; i < this.world.bodies.length - 1; i++) {
      for (let j = i + 1; j < this.world.bodies.length; j++) {
        const leftAABB = this.bodyAABBLookup.get(this.world.bodies[i]);
        const rightAABB = this.bodyAABBLookup.get(this.world.bodies[j]);
        if (this.testAABBAABB(leftAABB, rightAABB)) {
          candidates.push([i, j]);
        }
      }
    }
    return candidates;
  }

  private narrowPhase(pairs: [number, number][]): BodiesContactPoint[] {
    const contacts: BodiesContactPoint[] = [];

    for (let [left, right] of pairs) {
      const leftBody = this.world.bodies[left];
      const rightBody = this.world.bodies[right];
      const leftShape = this.world.bodyShapeLookup.get(leftBody);
      const rightShape = this.world.bodyShapeLookup.get(rightBody);

      let manifold: ContactManifold = [];
      const mtv = new MTV();
      let spaceMapping: SpaceMappingInterface = new SpaceMapping(
        leftBody.transform,
        rightBody.transform
      );

      if (leftShape instanceof Circle && rightShape instanceof Circle) {
        if (sat.testCircleCircle(mtv, leftShape, rightShape, spaceMapping)) {
          getCircleCircleContactManifold(
            manifold,
            mtv,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Polygon && rightShape instanceof Circle) {
        if (sat.testPolyCircle(mtv, leftShape, rightShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            mtv,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Circle && rightShape instanceof Polygon) {
        spaceMapping = inverseSpaceMapping(spaceMapping);
        if (sat.testPolyCircle(mtv, rightShape, leftShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            mtv,
            rightShape,
            leftShape,
            spaceMapping
          );
        }
      } else if (
        leftShape instanceof Polygon &&
        rightShape instanceof Polygon
      ) {
        if (sat.testPolyPoly(mtv, leftShape, rightShape, spaceMapping)) {
          getPolyPolyContactManifold(
            manifold,
            mtv,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      }

      for (const contact of manifold) {
        // @todo: get rid of junk
        contacts.push({
          bodyAIndex: contact.shape0 === leftShape ? left : right,
          bodyBIndex: contact.shape1 === rightShape ? right : left,
          point: vec2.clone(contact.point1),
          normal: vec2.fromValues(-contact.normal[0], -contact.normal[1]),
          depth: contact.depth
        });
      }
    }

    return contacts;
  }
}
