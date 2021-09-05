import { vec2 } from 'gl-matrix';

import { Body } from './body';
import {
  AABB,
  getCircleAABB,
  getPolyAABB,
  testAABBAABB,
  testCircleCircle as _testCircleCircle,
  testPolyCircle as _testPolyCircle,
  testPolyPoly as _testPolyPoly
} from './tests';
import { CircleShape, PolygonShape, World } from './world';

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
  inverse as inverseSpaceMapping
} from './collision';
import { Shape } from './collision/shape';

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

  private updateAABBs() {
    for (const body of this.world.bodies) {
      const shape = this.world.bodyShapeLookup.get(body);
      const aabb = this.bodyAABBLookup.get(body);

      if (shape instanceof CircleShape) {
        const box = getCircleAABB(shape.radius, body.position);
        vec2.copy(aabb[0], box[0]);
        vec2.copy(aabb[1], box[1]);
      } else if (shape instanceof PolygonShape) {
        const box = getPolyAABB(shape.points, body.transform);
        vec2.copy(aabb[0], box[0]);
        vec2.copy(aabb[1], box[1]);
      } else {
      }
    }
  }

  private broadPhase(): [number, number][] {
    const candidates = [];
    for (let i = 0; i < this.world.bodies.length - 1; i++) {
      for (let j = i + 1; j < this.world.bodies.length; j++) {
        const leftAABB = this.bodyAABBLookup.get(this.world.bodies[i]);
        const rightAABB = this.bodyAABBLookup.get(this.world.bodies[j]);
        if (testAABBAABB(leftAABB, rightAABB)) {
          candidates.push([i, j]);
        }
      }
    }
    return candidates;
  }

  private narrowPhase(pairs: [number, number][]): BodiesContactPoint[] {
    const contacts: BodiesContactPoint[] = [];

    // @todo:
    const createShape = (body: Body): Shape => {
      const shape = this.world.bodyShapeLookup.get(body);
      if (shape instanceof CircleShape) {
        return new Circle(shape.radius);
      } else if (shape instanceof PolygonShape) {
        return new Polygon(shape.points);
      }
      return null;
    };

    for (let [left, right] of pairs) {
      const leftBody = this.world.bodies[left];
      const rightBody = this.world.bodies[right];
      const leftShape = createShape(leftBody);
      const rightShape = createShape(rightBody);

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
