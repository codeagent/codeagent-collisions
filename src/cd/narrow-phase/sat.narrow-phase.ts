import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { pairId } from '../../utils';
import { Pair, PairsRegistry } from '../../dynamics';
import { SpaceMappingInterface, inverse } from '../../math';
import {
  ContactCandidatePair,
  ContactInfo,
  ContactCandidate,
} from '../contact';
import { Circle, Polygon } from '../shape';
import {
  testCircleCircle,
  ContactPoint,
  testPolyPoly,
  testPolyCircle,
} from './sat';
import { NarrowPhaseInterface } from './narrow-phase.interface';

@Service()
export class SatNarrowPhase implements NarrowPhaseInterface {
  constructor(
    @Inject(() => PairsRegistry)
    private readonly registry: { getPairById(id: number): Pair }
  ) {}

  *detectContacts(
    pairs: Iterable<ContactCandidatePair>
  ): Iterable<ContactInfo> {
    const contact: ContactPoint[] = [];

    for (let [left, right] of pairs) {
      const leftShape = left.shape;
      const rightShape = right.shape;
      const id = pairId(left.collider.id, right.collider.id);
      const pair = this.registry.getPairById(id);
      let spaceMapping = pair.spacesMapping;

      pair.updateTransforms();
      contact.length = 0;

      // Polygon
      if (leftShape instanceof Polygon && rightShape instanceof Polygon) {
        if (testPolyPoly(contact, leftShape, rightShape, spaceMapping)) {
          yield* this.getContactInfo(contact, left, right, spaceMapping);
        }
      } else if (leftShape instanceof Polygon && rightShape instanceof Circle) {
        if (testPolyCircle(contact, leftShape, rightShape, spaceMapping)) {
          yield* this.getContactInfo(contact, left, right, spaceMapping);
        }
      }
      // Circle
      else if (leftShape instanceof Circle && rightShape instanceof Polygon) {
        spaceMapping = inverse(spaceMapping);
        if (testPolyCircle(contact, rightShape, leftShape, spaceMapping)) {
          yield* this.getContactInfo(contact, right, left, spaceMapping);
        }
      } else if (leftShape instanceof Circle && rightShape instanceof Circle) {
        if (testCircleCircle(contact, leftShape, rightShape, spaceMapping)) {
          yield* this.getContactInfo(contact, left, right, spaceMapping);
        }
      }
    }
  }

  private *getContactInfo(
    contactPoints: Readonly<ContactPoint>[],
    candidate0: Readonly<ContactCandidate>,
    candidate1: Readonly<ContactCandidate>,
    spaceMapping: SpaceMappingInterface
  ): Iterable<ContactInfo> {
    for (const contactPoint of contactPoints) {
      const localPoint0 = vec2.create();
      spaceMapping.toFirstPoint(localPoint0, contactPoint.point0);

      const localPoint1 = vec2.create();
      spaceMapping.toSecondPoint(localPoint1, contactPoint.point1);

      yield {
        collider0: candidate0.collider,
        collider1: candidate1.collider,
        shape0: candidate0.shape,
        shape1: candidate1.shape,
        point0: contactPoint.point0,
        localPoint0,
        point1: contactPoint.point1,
        localPoint1,
        normal: contactPoint.normal,
        depth: contactPoint.depth,
      };
    }
  }
}
