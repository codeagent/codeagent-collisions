import { vec2 } from "gl-matrix";

import { Body } from "./body";
import {
  AABB,
  ContactManifold,
  getCircleAABB,
  getContactManifold,
  getPolyAABB,
  testAABBAABB,
  testCircleCircle,
  testPolyCircle,
  testPolyPoly
} from "./tests";
import { CircleShape, PolygonShape, World } from "./world";

export interface ContactPoint {
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

  private narrowPhase(pairs: [number, number][]): ContactPoint[] {
    const contacts: ContactPoint[] = [];

    for (const [left, right] of pairs) {
      const leftBody = this.world.bodies[left];
      const rightBody = this.world.bodies[right];
      const leftShape = this.world.bodyShapeLookup.get(leftBody);
      const rightShape = this.world.bodyShapeLookup.get(rightBody);

      let manifold: ContactManifold = [];

      if (leftShape instanceof CircleShape) {
        if (rightShape instanceof CircleShape) {
          manifold = testCircleCircle(
            leftShape.radius,
            leftBody.position,
            rightShape.radius,
            rightBody.position
          );

          for (const contact of manifold) {
            contacts.push({
              bodyAIndex: contact.index === 0 ? left : right,
              bodyBIndex: contact.index === 0 ? right : left,
              point: vec2.fromValues(contact.point[0], contact.point[1]),
              normal: vec2.fromValues(contact.normal[0], contact.normal[1]),
              depth: contact.depth
            });
          }
        } else if (rightShape instanceof PolygonShape) {
          manifold = testPolyCircle(
            rightShape.points,
            rightBody.transform,
            leftShape.radius,
            leftBody.position
          );

          for (const contact of manifold) {
            contacts.push({
              bodyAIndex: contact.index === 1 ? left : right,
              bodyBIndex: contact.index === 1 ? right : left,
              point: vec2.fromValues(contact.point[0], contact.point[1]),
              normal: vec2.fromValues(contact.normal[0], contact.normal[1]),
              depth: contact.depth
            });
          }
        }
      } else if (leftShape instanceof PolygonShape) {
        if (rightShape instanceof CircleShape) {
          manifold = testPolyCircle(
            leftShape.points,
            leftBody.transform,
            rightShape.radius,
            rightBody.position
          );

          for (const contact of manifold) {
            contacts.push({
              bodyAIndex: contact.index === 0 ? left : right,
              bodyBIndex: contact.index === 0 ? right : left,
              point: vec2.fromValues(contact.point[0], contact.point[1]),
              normal: vec2.fromValues(contact.normal[0], contact.normal[1]),
              depth: contact.depth
            });
          }
        } else if (rightShape instanceof PolygonShape) {
          manifold = testPolyPoly(
            leftShape.points,
            leftBody.transform,
            rightShape.points,
            rightBody.transform
          );

          for (const contact of manifold) {
            contacts.push({
              bodyAIndex: contact.index === 0 ? left : right,
              bodyBIndex: contact.index === 0 ? right : left,
              point: vec2.fromValues(contact.point[0], contact.point[1]),
              normal: vec2.fromValues(contact.normal[0], contact.normal[1]),
              depth: contact.depth
            });
          }
        }
      }
    }

    return contacts;
  }
}
