import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { closestPointsBetweenLineSegments } from '..';
import { Settings } from '../settings';

import { Collider } from './collider';
import { MeshShape } from './shape';
import { getToi } from './toi';
import {
  ContactInfo,
  MidPhaseInterface,
  BroadPhaseInterface,
  NarrowPhaseInterface,
} from './types';

@Service()
export class CollisionDetector {
  private readonly continuous = new Array<Collider>();

  private readonly p0 = vec2.create();

  private readonly p1 = vec2.create();

  private readonly q0 = vec2.create();

  private readonly q1 = vec2.create();

  private readonly c0 = vec2.create();

  private readonly c1 = vec2.create();

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('BROAD_PHASE') private readonly broadPhase: BroadPhaseInterface,
    @Inject('MID_PHASE') private readonly midPhase: MidPhaseInterface,
    @Inject('NARROW_PHASE') private readonly narrowPhase: NarrowPhaseInterface
  ) {}

  getTimeOfFirstImpact(dt: number): number {
    let minToi = 1;
    const pairs = new Set<[Collider, Collider]>();
    const cNumber = this.continuous.length;

    for (let i = 0; i < cNumber; i++) {
      const left = this.continuous[i];

      vec2.copy(this.p0, left.body.position);
      vec2.scaleAndAdd(this.p1, this.p0, left.body.velocity, dt);

      for (let j = i + 1; j < cNumber; j++) {
        const right = this.continuous[j];

        if ((left.mask & right.mask) === 0x0) {
          continue;
        }

        vec2.copy(this.q0, right.body.position);
        vec2.scaleAndAdd(this.q1, this.q0, right.body.velocity, dt);

        if (
          this.testCapsuleCapsule(
            this.p0,
            this.p1,
            left.shape.radius,
            this.q0,
            this.q1,
            right.shape.radius
          )
        ) {
          pairs.add([left, right]);
        }
      }

      const query = this.broadPhase.queryCapsule(
        this.p0,
        this.p1,
        left.shape.radius
      );

      for (const right of query) {
        if (
          right === left ||
          right.body.continuous ||
          (left.mask & right.mask) === 0x0
        ) {
          continue;
        }

        pairs.add([left, right]);
      }
    }

    for (const [left, right] of pairs) {
      let toi = 0;

      if (right.shape instanceof MeshShape) {
        // @todo: involve bsp-trees for meshes
      } else {
        toi = getToi(
          left.body,
          left.shape.radius,
          right.body,
          right.shape.radius,
          dt,
          this.settings.toiEpsilon,
          this.settings.toiMaxIterations,
          this.settings.toiPenetrationDepth
        );

        if (toi < minToi) {
          minToi = toi;
        }
      }
    }

    return minToi;
  }

  registerCollider(collider: Collider): void {
    this.broadPhase.registerCollider(collider);

    if (collider.body.continuous) {
      this.continuous.push(collider);
    }
  }

  unregisterCollider(collider: Collider): void {
    this.broadPhase.unregisterCollider(collider);

    if (collider.body.continuous) {
      this.continuous.splice(this.continuous.indexOf(collider), 1);
    }
  }

  *detectCollisions(): Iterable<ContactInfo> {
    const midCandidates = this.broadPhase.detectCandidates();
    const contactCandidates = this.midPhase.detectCandidates(midCandidates);
    yield* this.narrowPhase.detectContacts(contactCandidates);
  }

  private testCapsuleCapsule(
    p0: Readonly<vec2>,
    p1: Readonly<vec2>,
    radius0: number,
    q0: Readonly<vec2>,
    q1: Readonly<vec2>,
    radius1: number
  ): boolean {
    closestPointsBetweenLineSegments(this.c0, this.c1, p0, p1, q0, q1);

    const r = radius0 + radius1;
    return vec2.squaredDistance(this.c0, this.c1) < r * r;
  }
}
