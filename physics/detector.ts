import { vec2 } from "gl-matrix";

import { Body } from "./body";
import { AABB, getContactManifold, testAABBAABB } from "./tests";
import { World } from "./world";

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
    const v = vec2.create();

    for (const body of this.world.bodies) {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const p of body.shape) {
        vec2.transformMat3(v, p, body.transform);

        if (v[0] < minX) {
          minX = v[0];
        }
        if (v[1] < minY) {
          minY = v[1];
        }
        if (v[0] > maxX) {
          maxX = v[0];
        }
        if (v[1] > maxY) {
          maxY = v[1];
        }
      }

      const aabb = this.bodyAABBLookup.get(body);
      vec2.set(aabb[0], minX, minY);
      vec2.set(aabb[1], maxX, maxY);
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

  private narrowPhase(paris: [number, number][]): ContactPoint[] {
    const contacts: ContactPoint[] = [];

    for (const [left, right] of paris) {
      const manifold = getContactManifold(
        this.world.bodies[left].shape,
        this.world.bodies[left].transform,
        this.world.bodies[right].shape,
        this.world.bodies[right].transform
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

    return contacts;
  }
}
