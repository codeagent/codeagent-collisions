import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { PairsRegistryInterface } from '../../dynamics';
import { SpaceMappingInterface } from '../../math';
import { pairId } from '../../utils';
import {
  ContactCandidatePair,
  ContactInfo,
  ContactCandidate,
} from '../contact';
import { Circle, Polygon } from '../shape';

import { NarrowPhaseInterface } from './narrow-phase.interface';
import {
  testCircleCircle,
  ContactPoint,
  testPolyPoly,
  testPolyCircle,
} from './sat';

@Service()
export class SatNarrowPhase implements NarrowPhaseInterface {
  constructor(
    @Inject('PAIRS_REGISTRY')
    private readonly registry: PairsRegistryInterface
  ) {}

  *detectContacts(
    pairs: Iterable<ContactCandidatePair>
  ): Iterable<ContactInfo> {
    const contact: ContactPoint[] = [];

    for (const [left, right] of pairs) {
      const id = pairId(left.collider.id, right.collider.id);
      const pair = this.registry.getPairById(id);

      if (!pair.intercontact) {
        continue;
      }

      pair.updateTransform();

      contact.length = 0;

      // Polygon
      if (left.shape instanceof Polygon && right.shape instanceof Polygon) {
        if (testPolyPoly(contact, left.shape, right.shape, pair.spaceMapping)) {
          yield* this.getContactInfo(contact, left, right, pair.spaceMapping);
        }
      } else if (
        left.shape instanceof Polygon &&
        right.shape instanceof Circle
      ) {
        if (
          testPolyCircle(contact, left.shape, right.shape, pair.spaceMapping)
        ) {
          yield* this.getContactInfo(contact, left, right, pair.spaceMapping);
        }
      }
      // Circle
      else if (left.shape instanceof Circle && right.shape instanceof Polygon) {
        if (
          testPolyCircle(
            contact,
            right.shape,
            left.shape,
            pair.spaceMapping.inverted()
          )
        ) {
          yield* this.getContactInfo(
            contact,
            right,
            left,
            pair.spaceMapping.inverted()
          );
        }
      } else if (
        left.shape instanceof Circle &&
        right.shape instanceof Circle
      ) {
        if (
          testCircleCircle(contact, left.shape, right.shape, pair.spaceMapping)
        ) {
          yield* this.getContactInfo(contact, left, right, pair.spaceMapping);
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
