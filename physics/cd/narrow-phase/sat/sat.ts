import { vec2 } from 'gl-matrix';

import { MTV } from './mtv';
import { Shape } from '../../shape';
import {
  inverse,
  SpaceMappingInterface,
  closestPointToLineSegment,
} from '../../../math';

export namespace sat {
  class FaceDistanceQuery {
    public faceIndex = -1;
    public distance = Number.NEGATIVE_INFINITY;
  }

  interface PolygonLike {
    readonly normals: vec2[];
    readonly points: vec2[];
  }

  interface CircleLike {
    readonly radius: number;
  }

  const queryBestFace = (
    query: FaceDistanceQuery,
    poly: PolygonLike,
    shape: Shape,
    spaceMapping: SpaceMappingInterface
  ): FaceDistanceQuery => {
    query.distance = Number.NEGATIVE_INFINITY;
    query.faceIndex = -1;

    const d = vec2.create();
    const s = vec2.create();

    for (let i = 0; i < poly.points.length; i++) {
      const n = poly.normals[i];
      const p = poly.points[i];

      vec2.negate(d, n);
      spaceMapping.fromFirstToSecondVector(d, d);

      shape.support(s, d);
      spaceMapping.fromSecondToFirstPoint(s, s);

      vec2.sub(s, s, p);
      let proj = vec2.dot(n, s);
      if (proj >= 0) {
        // separating axis was found - early exit
        query.distance = proj;
        query.faceIndex = i;
        return query;
      } else {
        if (proj > query.distance) {
          query.distance = proj;
          query.faceIndex = i;
        }
      }
    }

    return query;
  };

  export const testPolyPoly = (
    query: MTV,
    poly0: PolygonLike & Shape,
    poly1: PolygonLike & Shape,
    spaceMapping: SpaceMappingInterface
  ): boolean => {
    const query0 = new FaceDistanceQuery();
    queryBestFace(query0, poly0, poly1, spaceMapping);

    if (query0.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.shapeIndex = -1;
      query.vector = null;
      return false;
    }

    const query1 = new FaceDistanceQuery();
    queryBestFace(query1, poly1, poly0, inverse(spaceMapping));

    if (query1.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.shapeIndex = -1;
      query.vector = null;
      return false;
    }

    if (query0.distance > query1.distance) {
      query.depth = -query0.distance;
      query.faceIndex = query0.faceIndex;
      query.shapeIndex = 0;
      query.vector = spaceMapping.fromFirstVector(
        vec2.create(),
        poly0.normals[query0.faceIndex]
      );
    } else {
      query.depth = -query1.distance;
      query.faceIndex = query1.faceIndex;
      query.shapeIndex = 1;
      query.vector = spaceMapping.fromSecondVector(
        vec2.create(),
        poly1.normals[query1.faceIndex]
      );
    }

    return true;
  };

  export const testPolyCircle = (
    query: MTV,
    poly: Shape & PolygonLike,
    circle: Shape & CircleLike,
    spaceMapping: SpaceMappingInterface
  ): boolean => {
    const query0 = new FaceDistanceQuery();
    queryBestFace(query0, poly, circle, spaceMapping);

    if (query0.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.shapeIndex = -1;
      query.vector = null;
      return false;
    }

    const a = vec2.create();
    spaceMapping.fromFirstPoint(a, poly.points[query0.faceIndex]);

    const b = vec2.create();
    spaceMapping.fromFirstPoint(
      b,
      poly.points[(query0.faceIndex + 1) % poly.points.length]
    );

    const c = vec2.create();
    spaceMapping.fromSecondPoint(c, c);

    const v = vec2.create();
    closestPointToLineSegment(v, a, b, c);

    vec2.sub(v, v, c);
    const length2 = vec2.dot(v, v);
    if (length2 < circle.radius * circle.radius) {
      const length = Math.sqrt(length2);
      query.depth = circle.radius - length;
      query.faceIndex = query0.faceIndex;
      query.shapeIndex = 0;
      query.vector = vec2.scale(v, v, 1.0 / length);

      return true;
    }

    query.depth = Number.NEGATIVE_INFINITY;
    query.faceIndex = -1;
    query.shapeIndex = -1;
    query.vector = null;

    return false;
  };

  export const testCircleCircle = (
    query: MTV,
    circle0: Shape & CircleLike,
    circle1: Shape & CircleLike,
    spaceMapping: SpaceMappingInterface
  ): boolean => {
    const center0 = vec2.create();
    spaceMapping.fromFirstPoint(center0, center0);

    const center1 = vec2.create();
    spaceMapping.fromSecondPoint(center1, center1);

    const depth =
      circle0.radius + circle1.radius - vec2.distance(center0, center1);

    if (depth > 0) {
      const normal = vec2.create();
      vec2.sub(normal, center1, center0);
      vec2.normalize(normal, normal);
      vec2.negate(normal, normal);
      query.depth = depth;
      query.faceIndex = -1;
      query.shapeIndex = 0;
      query.vector = normal;
      return true;
    }

    query.depth = Number.NEGATIVE_INFINITY;
    query.faceIndex = -1;
    query.shapeIndex = -1;
    query.vector = null;

    return false;
  };
}
