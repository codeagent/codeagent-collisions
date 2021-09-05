import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { Circle, Polygon } from './shape';
import { MTV } from './mtv';
import { inverse, SpaceMapping, SpaceMappingInterface } from './space-mapping';
import { sat } from './sat';
import {
  getCircleCircleContactManifold,
  getPolyCircleContactManifold,
  ContactManifold,
  getPolyPolyContactManifold
} from './contact';
import { drawLineSegment } from '../../draw';

export const satTest = (world: World) => {
  for (let l = 0; l < world.bodies.length; l++) {
    for (let r = l + 1; r < world.bodies.length; r++) {
      const leftBody = world.bodies[l];
      const rightBody = world.bodies[r];
      const leftShape = world.bodyShapeLookup.get(leftBody);
      const rightShape = world.bodyShapeLookup.get(rightBody);

      const query = new MTV();
      let spaceMapping: SpaceMappingInterface = new SpaceMapping(
        leftBody.transform,
        rightBody.transform
      );
      const manifold: ContactManifold = [];
      if (leftShape instanceof Circle && rightShape instanceof Circle) {
        if (sat.testCircleCircle(query, leftShape, rightShape, spaceMapping)) {
          getCircleCircleContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Circle && rightShape instanceof Polygon) {
        spaceMapping = inverse(spaceMapping);
        if (sat.testPolyCircle(query, rightShape, leftShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            query,
            rightShape,
            leftShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Polygon && rightShape instanceof Circle) {
        if (sat.testPolyCircle(query, leftShape, rightShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (
        leftShape instanceof Polygon &&
        rightShape instanceof Polygon
      ) {
        if (sat.testPolyPoly(query, leftShape, rightShape, spaceMapping)) {
          getPolyPolyContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );

          markPolyEdges(query, leftShape, rightShape, spaceMapping);
        }
      }
    }
  }
};

const markPolyEdges = (
  mtv: MTV,
  leftShape: Polygon,
  rightShape: Polygon,
  spaceMapping: SpaceMappingInterface
) => {
  {
    let reference: Polygon;

    if (mtv.shapeIndex === 0) {
      reference = leftShape;
    } else {
      reference = rightShape;
      spaceMapping = inverse(spaceMapping); // first=reference second=incident
    }

    const p0 = vec2.clone(reference.points[mtv.faceIndex]);
    spaceMapping.fromFirstPoint(p0, p0);

    const p1 = vec2.clone(
      reference.points[(mtv.faceIndex + 1) % reference.points.length]
    );
    spaceMapping.fromFirstPoint(p1, p1);

    drawLineSegment([p0, p1], '#ff0000');
    vec2.scale(mtv.vector, mtv.vector, -Math.abs(mtv.depth));
    vec2.add(p1, p0, mtv.vector);
    drawLineSegment([p0, p1], '#0000ff');
  }
};
