import { mat2, mat3, vec2, vec3 } from 'gl-matrix';

export namespace sat {
  export interface Shape {
    /**
     * @param out result will be placed here
     * @param dir normalized direction to search support point along
     * @returns support point on local frame of reference
     */
    support(out: vec2, dir: vec2): vec2;
  }

  export interface Transformable {
    readonly transform: mat3;
  }

  export interface ShapeProxy<T = Shape> {
    shape: T;
    transformable: Transformable;
  }

  class FaceDistanceQuery {
    public faceIndex = -1;
    public distance = Number.NEGATIVE_INFINITY;
  }

  export class MTVQuery {
    vector: vec2 = null;
    depth: number = Number.NEGATIVE_INFINITY;
    polyIndex: -1 | 0 | 1 = -1;
    faceIndex: number = -1;
  }

  export class Circle implements Shape {
    constructor(public readonly radius: number) {}

    public support(out: vec2, dir: vec2): vec2 {
      vec2.normalize(out, dir);
      return vec2.scale(out, out, this.radius);
    }
  }

  export class Polygon implements Shape {
    public readonly normals: vec2[];

    /**
     * @param hull array of couter-clock wise oriented loop of points
     */
    constructor(public readonly points: vec2[]) {
      this.normals = this.getNormals(points);
    }

    public support(out: vec2, dir: vec2): vec2 {
      // @todo: hill climbing
      let bestDot = Number.NEGATIVE_INFINITY;
      vec2.copy(out, this.points[0]);

      for (const p of this.points) {
        const dot = vec2.dot(p, dir);
        if (dot > bestDot) {
          bestDot = dot;
          vec2.copy(out, p);
        }
      }

      return out;
    }

    private getNormals(loop: vec2[]): vec2[] {
      const normals: vec2[] = [];
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        const n = vec2.create();
        vec2.sub(n, b, a);
        vec2.set(n, n[1], -n[0]);
        vec2.normalize(n, n);
        normals.push(n);
      }
      return normals;
    }
  }

  export class Box extends Polygon {
    constructor(public readonly width: number, public readonly height: number) {
      super([
        vec2.fromValues(-width * 0.5, height * 0.5),
        vec2.fromValues(-width * 0.5, -height * 0.5),
        vec2.fromValues(width * 0.5, -height * 0.5),
        vec2.fromValues(width * 0.5, height * 0.5)
      ]);
    }
  }

  const queryBestFace = (
    query: FaceDistanceQuery,
    poly: ShapeProxy<Polygon>,
    shape: ShapeProxy<Shape>
  ): FaceDistanceQuery => {
    const polyToShapeMat = mat2.create();
    mat2.set(
      polyToShapeMat,
      poly.transformable.transform[0],
      poly.transformable.transform[1],
      poly.transformable.transform[3],
      poly.transformable.transform[4]
    );
    mat2.multiply(
      polyToShapeMat,
      mat2.fromValues(
        shape.transformable.transform[0],
        shape.transformable.transform[3],
        shape.transformable.transform[1],
        shape.transformable.transform[4]
      ),
      polyToShapeMat
    );

    const shapeToPolyMat = mat3.create();
    mat3.invert(shapeToPolyMat, poly.transformable.transform);
    mat3.multiply(
      shapeToPolyMat,
      shapeToPolyMat,
      shape.transformable.transform
    );

    query.distance = Number.NEGATIVE_INFINITY;
    query.faceIndex = -1;

    const d = vec2.create();
    const s = vec2.create();
    for (let i = 0; i < poly.shape.points.length; i++) {
      const n = poly.shape.normals[i];
      const p = poly.shape.points[i];
      vec2.negate(d, n);
      vec2.transformMat2(d, d, polyToShapeMat);
      shape.shape.support(s, d);
      vec2.transformMat3(s, s, shapeToPolyMat); // support point is given in local space of polygon
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

  export const testPolyPoly = (
    query: MTVQuery,
    poly0: ShapeProxy<Polygon>,
    poly1: ShapeProxy<Polygon>
  ): boolean => {
    const query0 = new FaceDistanceQuery();
    queryBestFace(query0, poly0, poly1);

    if (query0.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.polyIndex = -1;
      query.vector = null;
      return false;
    }

    const query1 = new FaceDistanceQuery();
    queryBestFace(query1, poly1, poly0);

    if (query1.distance >= 0) {
      query.depth = Number.NEGATIVE_INFINITY;
      query.faceIndex = -1;
      query.polyIndex = -1;
      query.vector = null;
      return false;
    }

    if (query0.distance > query1.distance) {
      query.depth = -query0.distance;
      query.faceIndex = query0.faceIndex;
      query.polyIndex = 0;
      query.vector = vec2.transformMat2(
        vec2.create(),
        poly0.shape.normals[query0.faceIndex],
        mat2.fromValues(
          poly0.transformable.transform[0],
          poly0.transformable.transform[1],
          poly0.transformable.transform[3],
          poly0.transformable.transform[4]
        )
      );
    } else {
      query.depth = -query1.distance;
      query.faceIndex = query1.faceIndex;
      query.polyIndex = 1;
      query.vector = vec2.transformMat2(
        vec2.create(),
        poly1.shape.normals[query1.faceIndex],
        mat2.fromValues(
          poly1.transformable.transform[0],
          poly1.transformable.transform[1],
          poly1.transformable.transform[3],
          poly1.transformable.transform[4]
        )
      );
    }

    return true;
  };
}
