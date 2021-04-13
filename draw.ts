import { vec2, mat3 } from "gl-matrix";

import { ContactManifold, Body, World } from "./physics";
import {
  ConstraintInterface,
  ContactConstraint,
  DistanceConstraint
} from "./physics/constraints";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const context = canvas.getContext("2d") as CanvasRenderingContext2D;
export const container = document.getElementById("container") as HTMLDivElement;

export const clear = (): void => {
  context.clearRect(0, 0, canvas.width, canvas.height);
};

const projMat = mat3.fromValues(40, 0, 0, 0, -40, 0, 400, 400, 0);

export const drawBody = (body: Body, color: string, dashed = false) => {
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [1, 1] : []);

  context.beginPath();
  for (let i = 0; i < body.shape.length; i++) {
    const p0 = vec2.create();
    const p1 = vec2.create();

    vec2.transformMat3(p0, body.shape[i], body.transform);
    vec2.transformMat3(p0, p0, projMat);
    vec2.transformMat3(
      p1,
      body.shape[(i + 1) % body.shape.length],
      body.transform
    );
    vec2.transformMat3(p1, p1, projMat);

    if (i === 0) {
      context.moveTo(p0[0], p0[1]);
    }
    context.lineTo(p1[0], p1[1]);
  }
  context.stroke();
  context.setLineDash([]);
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
  context.lineWidth = 1;
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
  const RED_COLOR = "#ff0000";
  const BLUISH_COLOR = "#0356fc";
  const LINE_COLOR = "#f5ad42";

  const t = vec2.create();
  manifold.forEach(({ point, normal, depth, index }) => {
    vec2.add(t, point, normal);
    drawLineSegment([point, t], LINE_COLOR);
    drawDot(point, index === 0 ? RED_COLOR : BLUISH_COLOR);
  });
};

export const drawConstraint = (constraint: ConstraintInterface) => {
  const OUTER_COLOR = "#fc3503";
  const INNER_COLOR = "#0356fc";
  const LINE_COLOR = "#f5ad42";

  if (constraint instanceof DistanceConstraint) {
    const bodyA = constraint.world.bodies[constraint.bodyAIndex];
    const bodyB = constraint.world.bodies[constraint.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, constraint.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, constraint.jointB, bodyB.transform);
    drawLineSegment([pa, pb], LINE_COLOR);
    drawDot(pa, INNER_COLOR);
    drawDot(pb, OUTER_COLOR);
  } else if (constraint instanceof ContactConstraint) {
    const p = vec2.fromValues(constraint.joint[0], constraint.joint[1]);
    const n = vec2.fromValues(
      p[0] + constraint.normal[0],
      p[1] + constraint.normal[1]
    );
    drawLineSegment([p, n], LINE_COLOR);
    drawDot(p, OUTER_COLOR);
  }
};

export const drawWorld = (world: World): void => {
  const DEFAULT_COLOR = "#666666";

  world.bodies.forEach(body => drawBody(body, DEFAULT_COLOR));
  world.constraints.forEach(constraint => drawConstraint(constraint));
};
