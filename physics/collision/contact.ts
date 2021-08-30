import { mat3, vec2 } from 'gl-matrix';
import { MTV } from './mtv';
import { ShapeProxy } from './proxy';
import { Polygon } from './shape';

export interface ContactPoint {
  point: vec2;
  normal: vec2;
  depth: number;
  index: 0 | 1;
}
export type ContactManifold = ContactPoint[];

export const getPolyPolyContactManifold = (
  out: ContactManifold,
  mtv: MTV,
  poly0: ShapeProxy<Polygon>,
  poly1: ShapeProxy<Polygon>
): ContactManifold => {
  const reference = [poly0, poly1][mtv.shapeIndex];
  const incident = [poly1, poly0][mtv.shapeIndex];

  const incidentToRreferenceMat = mat3.create();
  mat3.invert(incidentToRreferenceMat, reference.transformable.transform);
  mat3.multiply(
    incidentToRreferenceMat,
    incidentToRreferenceMat,
    incident.transformable.transform
  );

  const inc0 = incident.shape.points[mtv.faceIndex];
  const inc1 =
    incident.shape.points[(mtv.faceIndex + 1) % incident.shape.points.length];
  const incN = incident.shape.normals[mtv.faceIndex];

  // find best

  return out;
};
