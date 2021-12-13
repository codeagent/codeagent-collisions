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
  SpaceMappingInterface,
  inverse as inverseSpaceMapping,
  AABB,
  betweenPair,
} from './collision';
import { Subject } from 'rxjs';
import { MeshShape, OBBNode, testAABBOBBTree } from './collision/mesh';
import { Shape } from './collision/shape';

export interface BodiesContactPoint {
  bodyAIndex: number;
  bodyBIndex: number;
  point: vec2;
  normal: vec2;
  depth: number;
}

export type BodiesPair = [Body, Body];
export type BodiesPairMap = Map<number, BodiesPair>;

interface Candidate<T extends Shape> {
  bodyIndex: number;
  shape: T;
}

type CandidatePair<T extends Shape = any> = [Candidate<T>, Candidate<T>];

export class CollisionDetector {
  private readonly bodyAABBLookup = new WeakMap<Body, AABB>();
  private readonly collideEnterBroadcast = new Subject<BodiesPair>();
  private readonly collideBroadcast = new Subject<BodiesPair>();
  private readonly collideLeaveBroadcast = new Subject<BodiesPair>();
  private readonly colliding: BodiesPairMap = new Map<number, BodiesPair>();
  private readonly pairs: BodiesPairMap = new Map<number, BodiesPair>();

  get collideEnter$() {
    return this.collideEnterBroadcast.asObservable();
  }

  get collide$() {
    return this.collideBroadcast.asObservable();
  }

  get collideLeave$() {
    return this.collideLeaveBroadcast.asObservable();
  }

  constructor(private readonly world: World) {}

  registerBody(body: Body) {
    this.bodyAABBLookup.set(body, [vec2.create(), vec2.create()]);
  }

  detectCollisions() {
    this.updateAABBs();
    const candidates = this.broadPhase();
    const contacts = this.narrowPhase(candidates);
    const { enter, collide, leave } = this.getCollisions(
      this.pairs,
      this.colliding
    );
    this.emitCollisions(enter, collide, leave);
    return contacts;
  }

  private pairId(left: Body, right: Body) {
    return left.id > right.id
      ? (left.id << 15) | right.id
      : (right.id << 15) | left.id;
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
      const shape = this.world.bodyShape.get(body);
      if (!(shape instanceof MeshShape)) {
        const aabb = this.bodyAABBLookup.get(body);
        shape.aabb(aabb, body.transform);
      }
    }
  }

  private broadPhase(): CandidatePair[] {
    const candidates: CandidatePair[] = [];
    const nodes = new Set<OBBNode>();
    for (let i = 0; i < this.world.bodies.length - 1; i++) {
      for (let j = i + 1; j < this.world.bodies.length; j++) {
        const leftBody = this.world.bodies[i];
        const rightBody = this.world.bodies[j];
        const leftShape = this.world.bodyShape.get(leftBody);
        const rightShape = this.world.bodyShape.get(rightBody);
        const leftAABB = this.bodyAABBLookup.get(leftBody);
        const rightAABB = this.bodyAABBLookup.get(rightBody);

        if (leftShape instanceof MeshShape) {
          if (
            testAABBOBBTree(
              nodes,
              rightAABB,
              leftShape.obbTree,
              leftBody.transform
            )
          ) {
            for (const node of nodes) {
              candidates.push([
                { bodyIndex: i, shape: node.triangleShape },
                { bodyIndex: j, shape: rightShape },
              ]);
            }
          }
        } else if (rightShape instanceof MeshShape) {
          if (
            testAABBOBBTree(
              nodes,
              leftAABB,
              rightShape.obbTree,
              rightBody.transform
            )
          ) {
            for (const node of nodes) {
              candidates.push([
                { bodyIndex: j, shape: node.triangleShape },
                { bodyIndex: i, shape: leftShape },
              ]);
            }
          }
        } else {
          if (this.testAABBAABB(leftAABB, rightAABB)) {
            candidates.push([
              { bodyIndex: i, shape: leftShape },
              { bodyIndex: j, shape: rightShape },
            ]);
          }
        }
      }
    }
    return candidates;
  }

  private narrowPhase(pairs: CandidatePair<any>[]): BodiesContactPoint[] {
    const contacts: BodiesContactPoint[] = [];

    this.pairs.clear();
    for (let [left, right] of pairs) {
      const leftBody = this.world.bodies[left.bodyIndex];
      const rightBody = this.world.bodies[right.bodyIndex];
      const leftShape = left.shape;
      const rightShape = right.shape;

      let manifold: ContactManifold = [];
      const mtv = new MTV();
      let spaceMapping: SpaceMappingInterface = betweenPair(
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
          bodyAIndex:
            contact.shape0 === leftShape ? left.bodyIndex : right.bodyIndex,
          bodyBIndex:
            contact.shape1 === rightShape ? right.bodyIndex : left.bodyIndex,
          point: vec2.clone(contact.point1),
          normal: vec2.fromValues(-contact.normal[0], -contact.normal[1]),
          depth: contact.depth,
        });
      }

      if (mtv.vector !== null) {
        this.pairs.set(this.pairId(leftBody, rightBody), [leftBody, rightBody]);
      }
    }

    return contacts;
  }

  private getCollisions(actual: BodiesPairMap, colliding: BodiesPairMap) {
    const enter: BodiesPair[] = [];
    const collide: BodiesPair[] = [];
    const leave: BodiesPair[] = [];

    const out = new Set(colliding.keys());

    for (const [id, pair] of actual) {
      if (!colliding.has(id)) {
        colliding.set(id, pair);
        enter.push(pair);
      } else {
        out.delete(id);
      }
      collide.push(pair);
    }

    for (const id of out) {
      leave.push(colliding.get(id));
      colliding.delete(id);
    }

    return { enter, collide, leave };
  }

  private emitCollisions(
    enter: BodiesPair[],
    collide: BodiesPair[],
    leave: BodiesPair[]
  ) {
    leave.forEach((pair) => this.collideLeaveBroadcast.next(pair));
    collide.forEach((pair) => this.collideBroadcast.next(pair));
    enter.forEach((pair) => this.collideEnterBroadcast.next(pair));
  }
}
