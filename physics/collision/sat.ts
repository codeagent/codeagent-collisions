import { mat2, mat3, vec2 } from 'gl-matrix';
import { MTV } from './mtv';
import { ShapeProxy } from './proxy';
import { Shape, Circle, Polygon } from './shape';
import { inverse, SpaceMappingInterface } from './space-mapping';

export namespace sat {
  class FaceDistanceQuery {
    public faceIndex = -1;
    public distance = Number.NEGATIVE_INFINITY;
  }

  const queryBestFace = (
    query: FaceDistanceQuery,
    poly: Polygon,
    shape: Shape,
    spaceMapping: SpaceMappingInterface
  ): FaceDistanceQuery => {
    // const polyToShapeMat = mat2.create();
    // mat2.set(
    //   polyToShapeMat,
    //   poly.transformable.transform[0],
    //   poly.transformable.transform[1],
    //   poly.transformable.transform[3],
    //   poly.transformable.transform[4]
    // );
    // mat2.multiply(
    //   polyToShapeMat,
    //   mat2.fromValues(
    //     shape.transformable.transform[0],
    //     shape.transformable.transform[3],
    //     shape.transformable.transform[1],
    //     shape.transformable.transform[4]
    //   ),
    //   polyToShapeMat
    // );

    // const shapeToPolyMat = mat3.create();
    // mat3.invert(shapeToPolyMat, poly.transformable.transform);
    // mat3.multiply(
    //   shapeToPolyMat,
    //   shapeToPolyMat,
    //   shape.transformable.transform
    // );

    query.distance = Number.NEGATIVE_INFINITY;
    query.faceIndex = -1;

    const d = vec2.create();
    const s = vec2.create();
    for (let i = 0; i < poly.points.length; i++) {
      const n = poly.normals[i];
      const p = poly.points[i];
      vec2.negate(d, n);
      // vec2.transformMat2(d, d, polyToShapeMat);
      spaceMapping.fromFirstToSecondVector(d, d);
      shape.support(s, d);
      // vec2.transformMat3(s, s, shapeToPolyMat); // support point is given in local space of polygon
      spaceMapping.fromSecondToFirstPoint(s, s);
      vec2.sub(s, s, p);
      let proj = vec2.dot(n, s);
      // separating axis was found - early exit
      if (proj >= 0) {
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

  export const closestPointToLineSegment = (
    out: vec2,
    a: vec2,
    b: vec2,
    p: vec2
  ): vec2 => {
    const ab = vec2.sub(vec2.create(), b, a);
    const ap = vec2.sub(vec2.create(), p, a);

    // Project c onto ab, computing parameterized position d(t)=a+ t*(b – a)
    let t = vec2.dot(ap, ab) / vec2.dot(ab, ab);

    if (t < 0.0) {
      vec2.copy(out, a);
    } else if (t > 1.0) {
      vec2.copy(out, b);
    } else {
      vec2.copy(out, a);
      return vec2.scaleAndAdd(out, a, ab, t);
    }
  };

  export const testPolyPoly = (
    query: MTV,
    poly0: ShapeProxy<Polygon>,
    poly1: ShapeProxy<Polygon>,
    spaceMapping: SpaceMappingInterface
  ): boolean => {
    const query0 = new FaceDistanceQuery();
    queryBestFace(query0, poly0.shape, poly1.shape, spaceMapping);

    if (query0.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.shapeIndex = -1;
      query.vector = null;
      return false;
    }

    const query1 = new FaceDistanceQuery();
    queryBestFace(query1, poly1.shape, poly0.shape, inverse(spaceMapping));

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
        poly0.shape.normals[query0.faceIndex]
      );
    } else {
      query.depth = -query1.distance;
      query.faceIndex = query1.faceIndex;
      query.shapeIndex = 1;
      query.vector = spaceMapping.fromSecondVector(
        vec2.create(),
        poly1.shape.normals[query1.faceIndex]
      );

      // query.vector = vec2.transformMat2(
      //   vec2.create(),
      //   poly1.shape.normals[query1.faceIndex],
      //   mat2.fromValues(
      //     poly1.transformable.transform[0],
      //     poly1.transformable.transform[1],
      //     poly1.transformable.transform[3],
      //     poly1.transformable.transform[4]
      //   )
      // );
    }

    return true;
  };

  export const testPolyCircle = (
    query: MTV,
    poly: ShapeProxy<Polygon>,
    circle: ShapeProxy<Circle>,
    spaceMapping: SpaceMappingInterface
  ): boolean => {
    const query0 = new FaceDistanceQuery();
    queryBestFace(query0, poly.shape, circle.shape, spaceMapping);

    if (query0.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.shapeIndex = -1;
      query.vector = null;
      return false;
    }

    const v = vec2.create();
    const a = vec2.create();
    vec2.transformMat3(
      a,
      poly.shape.points[query0.faceIndex],
      poly.transformable.transform
    );
    const b = vec2.create();
    vec2.transformMat3(
      b,
      poly.shape.points[(query0.faceIndex + 1) % poly.shape.points.length],
      poly.transformable.transform
    );
    const c = vec2.fromValues(
      circle.transformable.transform[6],
      circle.transformable.transform[7]
    );
    closestPointToLineSegment(v, a, b, c);
    vec2.sub(v, v, c);
    const length2 = vec2.dot(v, v);
    if (length2 < circle.shape.radius * circle.shape.radius) {
      const length = Math.sqrt(length2);
      query.depth = length - circle.shape.radius;
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
    circle0: ShapeProxy<Circle>,
    circle1: ShapeProxy<Circle>
  ): boolean => {
    const center0 = vec2.fromValues(
      circle0.transformable.transform[6],
      circle0.transformable.transform[7]
    );
    const center1 = vec2.fromValues(
      circle1.transformable.transform[6],
      circle1.transformable.transform[7]
    );

    const depth =
      circle0.shape.radius +
      circle1.shape.radius -
      vec2.distance(center0, center1);

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
