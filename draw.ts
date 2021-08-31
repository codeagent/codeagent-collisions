import { vec2, mat3 } from "gl-matrix";

import {
  ContactManifold,
  World,
  PolygonShape,
  Poly,
  CircleShape,
  ConstraintInterface,
  ContactConstraint,
  DistanceConstraint
} from "./physics";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d") as CanvasRenderingContext2D;

const DEFAULT_COLOR = "#666666";
const REDISH_COLOR = "#ff0000";
const BLUISH_COLOR = "#0356fc";
const LINE_COLOR = "#f5ad42";

export const projMat = mat3.fromValues(
  canvas.width / 30.0,
  0,
  0,
  0,
  -canvas.height / 20.0,
  0,
  canvas.width * 0.5,
  canvas.height * 0.5,
  1
);

export const clear = (): void => {
  context.clearRect(0, 0, canvas.width, canvas.height);
};

export const drawPolyShape = (
  poly: Poly,
  transform: mat3,
  color: string,
  dashed = false
) => {
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [1, 1] : []);

  context.beginPath();
  for (let i = 0; i < poly.length; i++) {
    const p0 = vec2.create();
    const p1 = vec2.create();

    vec2.transformMat3(p0, poly[i], transform);
    vec2.transformMat3(p0, p0, projMat);
    vec2.transformMat3(p1, poly[(i + 1) % poly.length], transform);
    vec2.transformMat3(p1, p1, projMat);

    if (i === 0) {
      context.moveTo(p0[0], p0[1]);
    }
    context.lineTo(p1[0], p1[1]);
  }
  context.stroke();
  context.setLineDash([]);
};

export const drawCircleShape = (
  radius: number,
  transform: mat3,
  color: string
) => {
  const c = vec2.transformMat3(
    vec2.create(),
    vec2.fromValues(0.0, 0.0),
    transform
  );

  const r = vec2.transformMat3(
    vec2.create(),
    vec2.fromValues(radius, 0.0),
    transform
  );

  vec2.transformMat3(c, c, projMat);
  vec2.transformMat3(r, r, projMat);

  context.lineWidth = 0.5;

  context.setLineDash([6, 2]);
  context.beginPath();
  context.strokeStyle = color;
  context.moveTo(c[0], c[1]);
  context.lineTo(r[0], r[1]);
  context.stroke();

  context.lineWidth = 1.0;

  context.setLineDash([]);
  context.beginPath();
  context.arc(c[0], c[1], radius * 40, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.stroke();
};

export const drawDot = (position: vec2, color = "#666666") => {
  const INNER_RADIUS = 2;
  context.beginPath();
  const p = vec2.transformMat3(vec2.create(), position, projMat);
  context.arc(p[0], p[1], INNER_RADIUS, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill();
};

export const drawLineSegment = (ed: [vec2, vec2], color = "#666666") => {
  context.setLineDash([]);

  context.beginPath();
  context.strokeStyle = color;
  const p0 = vec2.transformMat3(vec2.create(), ed[0], projMat);
  const p1 = vec2.transformMat3(vec2.create(), ed[1], projMat);
  context.moveTo(p0[0], p0[1]);
  context.lineTo(p1[0], p1[1]);

  context.stroke();
};

export const drawManifold = (manifold: ContactManifold) => {
  context.lineWidth = 0.5;
  const t = vec2.create();
  manifold.forEach(({ point, normal, depth, index }) => {
    vec2.add(t, point, normal);
    drawLineSegment([point, t], LINE_COLOR);
    drawDot(point, REDISH_COLOR);
  });
};

export const drawConstraint = (constraint: ConstraintInterface) => {
  context.lineWidth = 1;
  if (constraint instanceof DistanceConstraint) {
    const bodyA = constraint.world.bodies[constraint.bodyAIndex];
    const bodyB = constraint.world.bodies[constraint.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, constraint.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, constraint.jointB, bodyB.transform);
    drawLineSegment([pa, pb], LINE_COLOR);
    drawDot(pa, BLUISH_COLOR);
    drawDot(pb, BLUISH_COLOR);
  } else if (constraint instanceof ContactConstraint) {
    const p = vec2.fromValues(constraint.joint[0], constraint.joint[1]);
    const n = vec2.fromValues(
      p[0] + constraint.normal[0],
      p[1] + constraint.normal[1]
    );
    drawLineSegment([p, n], LINE_COLOR);
    drawDot(p, REDISH_COLOR);
  }
};

export const drawCross = (transform: mat3) => {
  context.lineWidth = 0.5;
  const a: [vec2, vec2] = [
    vec2.fromValues(-0.1, 0.0),
    vec2.fromValues(0.1, 0.0)
  ];
  const b: [vec2, vec2] = [
    vec2.fromValues(0.0, -0.1),
    vec2.fromValues(0.0, 0.1)
  ];
  a.forEach(p => vec2.transformMat3(p, p, transform));
  b.forEach(p => vec2.transformMat3(p, p, transform));

  drawLineSegment(a);
  drawLineSegment(b);
};

export const drawWorld = (world: World): void => {
  world.bodies.forEach(body => {
    const shape = world.bodyShapeLookup.get(body);
    drawCross(body.transform);
    if (shape instanceof PolygonShape) {
      drawPolyShape(shape.points, body.transform, DEFAULT_COLOR);
    } else if (shape instanceof CircleShape) {
      drawCircleShape(shape.radius, body.transform, DEFAULT_COLOR);
    }
  });
  // world.constraints.forEach(constraint => drawConstraint(constraint));
};
