import { Polygon } from '..';
import {
  betweenPair,
  SpaceMappingInterface,
  inverse as inverseSpaceMapping,
} from '../../math';
import { CollisionCandidate } from '../broad-phase';
import { Circle } from '../shape';
import { ContactInfo, NarrowPhaseInterface } from './narrow-phase.interface';
import {
  ContactManifold,
  getCircleCircleContactManifold,
  getPolyCircleContactManifold,
  getPolyPolyContactManifold,
  MTV,
  sat,
} from './sat';

export class SatNarrowPhase implements NarrowPhaseInterface {
  detectContacts(
    pairs: [CollisionCandidate, CollisionCandidate][]
  ): ContactInfo[] {
    const contacts: ContactInfo[] = [];

    for (let [left, right] of pairs) {
      const leftShape = left.shape;
      const rightShape = right.shape;

      let manifold: ContactManifold = [];
      const mtv = new MTV();
      let spaceMapping: SpaceMappingInterface = betweenPair(
        left.collider.transform,
        right.collider.transform
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
        // @experimental: get only one contact point per collidng pair (take deepest)

        if (mtv.vector !== null) {
          // let deepest = null;
          // let maxDepth = Number.NEGATIVE_INFINITY;
          // for (const contact of manifold) {
          //   if (contact.depth > maxDepth) {
          //     deepest = contact;
          //     maxDepth = contact.depth;
          //   }
          // }
          // const contact = deepest;

          contacts.push({
            collider0:
              contact.shape0 === left.shape ? left.collider : right.collider,
            collider1:
              contact.shape1 === right.shape ? right.collider : left.collider,
            shape0: contact.shape0,
            shape1: contact.shape1,
            point0: contact.point0,
            localPoint0: contact.localPoint0,
            point1: contact.point1,
            localPoint1: contact.localPoint1,
            normal: contact.normal,
            depth: contact.depth,
          });
        }
      }
    }

    return contacts;
  }
}
