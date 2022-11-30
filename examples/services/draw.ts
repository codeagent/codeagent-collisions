import { vec2, mat3 } from 'gl-matrix';

import {
  World,
  ConstraintInterface,
  ContactConstraint,
  DistanceConstraint,
  LineConstraint,
  Polygon,
  Circle,
  MaxDistanceConstraint,
  MinDistanceConstraint,
  SpringConstraint,
  Body,
  Mesh,
  MeshShape,
  OBB,
  OBBNode,
  AABB,
  ContactInfo,
  Capsule,
  Ellipse,
  transformMat3Vec,
  centroid,
  Edge,
} from 'js-physics-2d';

export const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;

export const DEFAULT_COLOR = '#666666';
export const REDISH_COLOR = '#ff0000';
export const BLUISH_COLOR = '#0356fc';
export const LINE_COLOR = '#f5ad42';

const createProjectionMatrix = (
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
  width: number,
  height: number
) =>
  mat3.fromValues(
    width / (xmax - xmin),
    0,
    0,
    0,
    height / (ymin - ymax),
    0,
    (xmin * width) / (xmin - xmax),
    (ymax * height) / (ymax - ymin),
    1
  );

export const projMat = createProjectionMatrix(
  -15,
  15,
  -20,
  10,
  Math.max(canvas.width, canvas.height),
  Math.max(canvas.width, canvas.height)
);

export const clear = (): void => {
  context.clearRect(0, 0, canvas.width, canvas.height);
};

export const drawText = (text: string, pos: vec2) => {
  context.font = '14px Calibri';
  context.fillStyle = DEFAULT_COLOR;
  context.textAlign = 'center';
  const center = vec2.create();
  vec2.transformMat3(center, pos, projMat);
  context.fillText(text, center[0], center[1]);
};

export const drawAABB = (aabb: AABB, color: string, dashed = false) => {
  const points = [
    vec2.fromValues(aabb[0][0], aabb[0][1]),
    vec2.fromValues(aabb[1][0], aabb[0][1]),
    vec2.fromValues(aabb[1][0], aabb[1][1]),
    vec2.fromValues(aabb[0][0], aabb[1][1]),
  ];

  context.lineWidth = 0.75;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [6, 3] : []);

  context.beginPath();

  for (let i = 0; i < points.length; i++) {
    const p0 = vec2.create();
    const p1 = vec2.create();

    vec2.transformMat3(p0, points[i], projMat);
    vec2.transformMat3(p1, points[(i + 1) % points.length], projMat);

    if (i === 0) {
      context.moveTo(p0[0], p0[1]);
    }
    context.lineTo(p1[0], p1[1]);
  }

  context.stroke();
  context.setLineDash([]);
};

export const drawPoly = (
  edges: Readonly<Edge>[],
  transform: Readonly<mat3>,
  color: string,
  dashed = false
) => {
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [3, 3] : []);

  context.beginPath();
  let i = 0;
  for (const edge of edges) {
    const p0 = vec2.create();
    const p1 = vec2.create();
    const n = vec2.create();

    vec2.transformMat3(p0, edge.v0.point, transform);
    vec2.transformMat3(p0, p0, projMat);

    vec2.transformMat3(p1, edge.v1.point, transform);
    vec2.transformMat3(p1, p1, projMat);

    transformMat3Vec(n, edge.v0.normal, transform);
    transformMat3Vec(n, n, projMat);

    context.moveTo(p0[0], p0[1]);
    context.lineTo(p1[0], p1[1]);

    // context.moveTo(p0[0], p0[1]);
    // context.lineTo(p0[0] + n[0], p0[1] + n[1]);

    i++;
  }
  context.stroke();
  context.setLineDash([]);
};

export const drawCircleShape = (
  radius: number,
  transform: Readonly<mat3>,
  color: string,
  dashed = true
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

  context.setLineDash(dashed ? [3, 3] : []);
  context.beginPath();
  context.arc(c[0], c[1], radius * 40, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.stroke();
};

export const drawCapsuleShape = (
  radius: number,
  extend: number,
  transform: Readonly<mat3>,
  color: string,
  dashed = true
) => {
  const c0 = vec2.fromValues(0.0, extend);
  vec2.transformMat3(c0, c0, transform);
  vec2.transformMat3(c0, c0, projMat);

  const c1 = vec2.fromValues(0.0, -extend);
  vec2.transformMat3(c1, c1, transform);
  vec2.transformMat3(c1, c1, projMat);

  const p0 = vec2.fromValues(radius, -extend);
  vec2.transformMat3(p0, p0, transform);
  vec2.transformMat3(p0, p0, projMat);

  const p1 = vec2.fromValues(radius, extend);
  vec2.transformMat3(p1, p1, transform);
  vec2.transformMat3(p1, p1, projMat);

  const p2 = vec2.fromValues(-radius, extend);
  vec2.transformMat3(p2, p2, transform);
  vec2.transformMat3(p2, p2, projMat);

  const p3 = vec2.fromValues(-radius, -extend);
  vec2.transformMat3(p3, p3, transform);
  vec2.transformMat3(p3, p3, projMat);

  const angle = -Math.atan2(transform[1], transform[0]);

  context.lineWidth = 1.0;

  // perimeter
  context.setLineDash(dashed ? [3, 3] : []);
  context.beginPath();
  context.arc(c0[0], c0[1], radius * 40, angle, angle + Math.PI, true);
  context.strokeStyle = color;
  context.stroke();

  context.beginPath();
  context.arc(c1[0], c1[1], radius * 40, angle, angle + Math.PI, false);
  context.strokeStyle = color;
  context.stroke();

  context.beginPath();
  context.moveTo(p0[0], p0[1]);
  context.lineTo(p1[0], p1[1]);

  context.moveTo(p2[0], p2[1]);
  context.lineTo(p3[0], p3[1]);
  context.stroke();

  // context.moveTo(c0[0], c0[1]);
  // context.lineTo(c1[0], c1[1]);
  // context.stroke();

  // context.moveTo(p0[0], p0[1]);
  // context.lineTo(p3[0], p3[1]);
  // context.stroke();

  // context.moveTo(p1[0], p1[1]);
  // context.lineTo(p2[0], p2[1]);
  // context.stroke();

  // auxiliary
  context.lineWidth = 0.5;

  context.setLineDash([6, 3]);
  context.beginPath();
  context.arc(c0[0], c0[1], radius * 40, angle, angle + Math.PI, false);
  context.strokeStyle = color;
  context.stroke();

  context.beginPath();
  context.arc(c1[0], c1[1], radius * 40, angle, angle + Math.PI, true);
  context.strokeStyle = color;
  context.stroke();
};

export const drawEllipseShape = (
  shape: Ellipse,
  transform: Readonly<mat3>,
  color: string,
  dashed = true
) => {
  const c = vec2.fromValues(transform[6], transform[7]);
  vec2.transformMat3(c, c, projMat);

  const r = vec2.transformMat3(
    vec2.create(),
    vec2.fromValues(shape.a, 0.0),
    transform
  );
  vec2.transformMat3(r, r, projMat);

  const angle = -Math.atan2(transform[1], transform[0]);
  context.lineWidth = 1.0;

  // perimeter
  context.setLineDash(dashed ? [3, 3] : []);
  context.beginPath();
  context.ellipse(
    c[0],
    c[1],
    shape.a * 40,
    shape.b * 40,
    angle,
    0,
    2 * Math.PI,
    true
  );

  context.stroke();

  // auxiliary
  context.setLineDash([6, 2]);
  context.beginPath();
  context.strokeStyle = color;
  context.moveTo(c[0], c[1]);
  context.lineTo(r[0], r[1]);
  context.stroke();
};

export const drawDot = (position: vec2, color = '#666666') => {
  const INNER_RADIUS = 2;
  context.beginPath();
  const p = vec2.transformMat3(vec2.create(), position, projMat);
  context.arc(p[0], p[1], INNER_RADIUS + 1, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill();
};

export const drawLineSegment = (
  ed: [vec2, vec2],
  color = '#666666',
  width = 1
) => {
  context.setLineDash([]);
  context.lineWidth = width;
  context.beginPath();
  context.strokeStyle = color;
  const p0 = vec2.transformMat3(vec2.create(), ed[0], projMat);
  const p1 = vec2.transformMat3(vec2.create(), ed[1], projMat);
  context.moveTo(p0[0], p0[1]);
  context.lineTo(p1[0], p1[1]);

  context.stroke();
};

export const drawGrid = (lines: number, step: number) => {
  let x = 0;
  let y = 0;
  const edge = -20;
  const AXIS = '#3399ff';
  const LINE = '#cce6ff';
  context.lineWidth = 0.5;
  for (let i = 0; i < lines; i++) {
    if (i === 0) {
      drawLineSegment(
        [vec2.fromValues(-edge, y), vec2.fromValues(edge, y)],
        AXIS
      );
      drawLineSegment(
        [vec2.fromValues(x, -edge), vec2.fromValues(x, edge)],
        AXIS
      );
    } else {
      drawLineSegment(
        [vec2.fromValues(-edge, y), vec2.fromValues(edge, y)],
        LINE
      );
      drawLineSegment(
        [vec2.fromValues(-edge, -y), vec2.fromValues(edge, -y)],
        LINE
      );
      drawLineSegment(
        [vec2.fromValues(x, -edge), vec2.fromValues(x, edge)],
        LINE
      );
      drawLineSegment(
        [vec2.fromValues(-x, -edge), vec2.fromValues(-x, edge)],
        LINE
      );
    }

    x += step;
    y += step;
  }
};

export const drawContact = (contact: ContactInfo, lineColor = LINE_COLOR) => {
  context.lineWidth = 0.5;
  const t = vec2.create();
  const point0 = vec2.create();
  const point1 = vec2.create();

  vec2.transformMat3(point0, contact.localPoint0, contact.collider0.transform);
  vec2.transformMat3(point1, contact.localPoint1, contact.collider1.transform);

  drawDot(contact.point0, BLUISH_COLOR);
  drawDot(point0, '#BB00FF');

  drawDot(contact.point1, REDISH_COLOR);
  drawDot(point1, '#00BB00');

  vec2.add(t, contact.point0, contact.normal);
  drawLineSegment([contact.point0, t], lineColor);
};

export const drawConstraint = (constraint: ConstraintInterface) => {
  context.lineWidth = 1;
  if (
    constraint instanceof DistanceConstraint ||
    constraint instanceof MaxDistanceConstraint ||
    constraint instanceof MinDistanceConstraint ||
    constraint instanceof LineConstraint ||
    constraint instanceof SpringConstraint
  ) {
    const pa = vec2.create();
    vec2.transformMat3(pa, constraint.jointA, constraint.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, constraint.jointB, constraint.bodyB.transform);
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

export const drawCross = (transform: Readonly<mat3>, color = '#666666') => {
  context.lineWidth = 0.5;
  const a: [vec2, vec2] = [
    vec2.fromValues(-0.1, 0.0),
    vec2.fromValues(0.1, 0.0),
  ];
  const b: [vec2, vec2] = [
    vec2.fromValues(0.0, -0.1),
    vec2.fromValues(0.0, 0.1),
  ];
  a.forEach((p) => vec2.transformMat3(p, p, transform));
  b.forEach((p) => vec2.transformMat3(p, p, transform));

  drawLineSegment(a, color);
  drawLineSegment(b, color);
};

export const drawGround = (origin: vec2, normal: vec2) => {
  context.lineWidth = 1.0;

  const extend = 1.0;
  const dashes = 8;
  const skew = 0.2;
  const dash = 0.2;
  const dir = vec2.fromValues(-normal[1], normal[0]);
  vec2.normalize(dir, dir);

  const p0 = vec2.create();
  vec2.scaleAndAdd(p0, origin, dir, extend);

  const p1 = vec2.create();
  vec2.scaleAndAdd(p1, origin, dir, -extend);

  drawLineSegment([p0, p1], LINE_COLOR);

  const delta = vec2.distance(p1, p0) / dashes;
  vec2.scaleAndAdd(p1, p0, normal, -dash);
  vec2.scaleAndAdd(p0, p0, dir, skew);

  context.lineWidth = 0.5;
  for (let i = 0; i < dashes; i++) {
    vec2.scaleAndAdd(p0, p0, dir, -delta);
    vec2.scaleAndAdd(p1, p1, dir, -delta);
    drawLineSegment([p1, p0], LINE_COLOR);
  }
};

export const drawBody = (
  body: Body,
  color: string,
  transform?: Readonly<mat3>
) => {
  if (!body.collider) {
    return;
  }

  transform = transform ?? body.transform;
  color = body.isSleeping ? '#AAAAAA' : color;

  let shape = body.collider.shape;
  drawCross(transform, color);
  if (shape instanceof Circle) {
    drawCircleShape(shape.radius, transform, color, body.isSleeping);
  } else if (shape instanceof Capsule) {
    drawCapsuleShape(
      shape.r,
      shape.height * 0.5,
      transform,
      color,
      body.isSleeping
    );
  } else if (shape instanceof Ellipse) {
    drawEllipseShape(shape, transform, color, body.isSleeping);
  } else if (shape instanceof Polygon) {
    drawPoly(Array.from(shape.edges()), transform, color, body.isSleeping);
  } else if (shape instanceof MeshShape) {
    drawMesh(shape.mesh, transform, color, body.isSleeping);
    // drawPoly(shape['hull'] as any, body.transform, LINE_COLOR);
  }

  // const aabb: AABB = [vec2.create(), vec2.create()];
  // shape.aabb(aabb, transform as any);
  // drawAABB(aabb, REDISH_COLOR);
};

export const drawMesh = (
  mesh: Mesh,
  transform: Readonly<mat3>,
  color: string,
  dashed = false
) => {
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [3, 3] : []);

  context.beginPath();
  for (const triangle of mesh) {
    for (let i = 0; i < 3; i++) {
      const p0 = vec2.create();
      const p1 = vec2.create();

      vec2.transformMat3(p0, triangle[`p${i}`], transform);
      vec2.transformMat3(p0, p0, projMat);
      vec2.transformMat3(p1, triangle[`p${(i + 1) % 3}`], transform);
      vec2.transformMat3(p1, p1, projMat);

      if (i === 0) {
        context.moveTo(p0[0], p0[1]);
      }

      context.lineTo(p1[0], p1[1]);
    }
  }

  context.stroke();
  context.setLineDash([]);

  for (const tri of mesh) {
    const c = centroid(tri);
    vec2.transformMat3(c, c, transform);
    drawDot(c, color);
  }
};

export const drawOBB = (obb: OBB, color: string, dashed = false) => {
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.setLineDash(dashed ? [1, 1] : []);

  context.beginPath();
  const points = [
    vec2.fromValues(-obb.extent[0], -obb.extent[1]),
    vec2.fromValues(obb.extent[0], -obb.extent[1]),
    vec2.fromValues(obb.extent[0], obb.extent[1]),
    vec2.fromValues(-obb.extent[0], obb.extent[1]),
  ];

  for (let i = 0; i < points.length; i++) {
    const p0 = vec2.create();
    const p1 = vec2.create();

    vec2.transformMat3(p0, points[i], obb.transform);
    vec2.transformMat3(p0, p0, projMat);
    vec2.transformMat3(p1, points[(i + 1) % points.length], obb.transform);
    vec2.transformMat3(p1, p1, projMat);

    if (i === 0) {
      context.moveTo(p0[0], p0[1]);
    }
    context.lineTo(p1[0], p1[1]);
  }

  context.stroke();
  context.setLineDash([]);

  const origin = vec2.fromValues(obb.transform[6], obb.transform[7]);
  drawDot(origin, REDISH_COLOR);

  const x = vec2.fromValues(obb.transform[0], obb.transform[1]);
  const y = vec2.fromValues(obb.transform[3], obb.transform[4]);

  const p0 = vec2.clone(origin);
  const p1 = vec2.add(vec2.create(), p0, x);
  drawLineSegment([p0, p1], REDISH_COLOR);

  vec2.add(p1, p0, y);
  drawLineSegment([p0, p1], BLUISH_COLOR);
};

export const drawOBBTree = (node: OBBNode, drawLevel = -1, leafs = false) => {
  const queue = [{ node, level: 0 }];

  while (queue.length) {
    const { node, level } = queue.shift();
    if (level == drawLevel || (node.payload && leafs)) {
      drawOBB(node.obb, COLORS[level]);
    }

    for (const child of node.children) {
      queue.push({ node: child, level: level + 1 });
    }
  }
};

export const drawWorld = (world: World): void => {
  world.bodies.forEach((body) => {
    drawBody(body, body.isStatic ? DEFAULT_COLOR : COLORS[body.islandId]);

    for (const contact of body.contacts) {
      // drawContact(contact.contactInfo);
    }

    for (const joint of body.joints) {
      Array.from(joint).forEach((constraint) => drawConstraint(constraint));
    }
  });

  drawGrid(20, 1.0);
};

const COLORS = [
  '#c17b5f',
  '#7dbc56',
  '#beb2d1',
  '#f8b64a',
  '#66c4d1',
  '#e8f435',
  '#169e14',
  '#64beea',
  '#b5f4f3',
  '#ea6d54',
  '#abb703',
  '#6c45f9',
  '#d6d02c',
  '#e28981',
  '#8f42ed',
  '#e06b83',
  '#f99fc3',
  '#ef3b95',
  '#7c8e07',
  '#5f2a93',
  '#e5c682',
  '#28e021',
  '#42dd57',
  '#dd1ca0',
  '#799604',
  '#1e8499',
  '#b0ba01',
  '#42f4bf',
  '#aee88d',
  '#2ccc81',
  '#3dc672',
  '#dd58d4',
  '#010166',
  '#120575',
  '#dd7398',
  '#7c42c9',
  '#efaec4',
  '#50ce76',
  '#9678c9',
  '#6456ce',
  '#ff7a97',
  '#b26123',
  '#5c00b2',
  '#35ba59',
  '#c44de2',
  '#c9249d',
  '#d0e589',
  '#f9c390',
  '#16bf70',
  '#442191',
  '#19fc20',
  '#735fce',
  '#63e8dd',
  '#d8639e',
  '#0f6384',
  '#12b7a1',
  '#89d34c',
  '#b3ffb2',
  '#db5eb5',
  '#ae80d6',
  '#a48ad8',
  '#70bf37',
  '#7fefd9',
  '#0d2b70',
  '#cab3f2',
  '#bdea41',
  '#383eed',
  '#0acc24',
  '#cea023',
  '#56ef74',
  '#60bed1',
  '#6fe27c',
  '#cb67db',
  '#7281cc',
  '#f4b297',
  '#e6fcae',
  '#8d5dfc',
  '#c00bc6',
  '#0e33af',
  '#e20fca',
  '#fcf9a6',
  '#3cf2d3',
  '#a3f76f',
  '#f43a5c',
  '#e06bc3',
  '#2cd695',
  '#e06e45',
  '#dbb300',
  '#45e537',
  '#b7ea88',
  '#e5a912',
  '#3566ba',
  '#33c48f',
  '#8f53ba',
  '#8185d3',
  '#f9cd09',
  '#b5d149',
  '#c9087c',
  '#b2312a',
  '#e0e244',
  '#ef94cf',
  '#edd39e',
  '#c65833',
  '#3229e5',
  '#d89c04',
  '#7efc8c',
  '#01b7ae',
  '#d5f72c',
  '#e2a07c',
  '#edb4f7',
  '#ccc806',
  '#e5ca90',
  '#eac84d',
  '#8fecf7',
  '#cbe585',
  '#a6ce04',
  '#2449b7',
  '#6644af',
  '#9fa4f4',
  '#9ef470',
  '#aee281',
  '#87f2de',
  '#291d99',
  '#f4c03d',
  '#ffec99',
  '#eb82ed',
  '#f2b0e0',
  '#c60978',
  '#6beae6',
  '#ed9cc3',
  '#6ced61',
  '#79ad0a',
  '#c24bea',
  '#d3ef8d',
  '#64fc74',
  '#a2db64',
  '#62b72d',
  '#8f98f7',
  '#47bc0d',
  '#669ce2',
  '#e0c372',
  '#16427c',
  '#250982',
  '#31c1c6',
  '#86c3ef',
  '#014aa3',
  '#8aed84',
  '#87e021',
  '#b6ffb2',
  '#cad149',
  '#d646b4',
  '#807dd8',
  '#717af2',
  '#c478ed',
  '#40ad1f',
];
