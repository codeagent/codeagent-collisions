import { Subject } from 'rxjs';

import { Body } from '../dynamics';

import {
  SatNarrowPhase,
  NarrowPhaseInterface,
  ContactInfo,
} from './narrow-phase';

import { BroadPhaseInterface, BruteForceBroadPhase } from './broad-phase';
import { Collider, BodyCollider } from './collider';

export type BodiesPair = [Body, Body];
export type BodiesPairMap = Map<number, BodiesPair>;

export class CollisionDetector {
  private readonly broadPhase: BroadPhaseInterface = new BruteForceBroadPhase();
  private readonly narrowPhase: NarrowPhaseInterface = new SatNarrowPhase();

  // @todo: replace bodies to colliders
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

  registerCollider(collider: Collider) {
    this.broadPhase.registerCollider(collider);
  }

  unregisterCollider(collider: Collider) {
    this.broadPhase.unregisterCollider(collider);
  }

  detectCollisions() {
    const candidates = this.broadPhase.detectCandidates();
    const contacts = this.narrowPhase.detectContacts(candidates);

    this.setPairs(contacts);
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

  private setPairs(contacts: ContactInfo[]) {
    for (const contact of contacts) {
      if (
        contact.collider0 instanceof BodyCollider &&
        contact.collider1 instanceof BodyCollider
      ) {
        const leftBody = contact.collider0.body;
        const rightBody = contact.collider1.body;

        this.pairs.set(this.pairId(leftBody, rightBody), [leftBody, rightBody]);
      }
    }
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
