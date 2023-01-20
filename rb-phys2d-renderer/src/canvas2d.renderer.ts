import { mat3, vec2 } from 'gl-matrix';
import {
  JointInterface,
  AABB,
  MeshShape,
  OBB,
  OBBNode,
  Circle,
  Polygon,
  Ellipse,
  Capsule,
  Contact,
  DistanceJoint,
  MotorJoint,
  MouseJoint,
  PrismaticJoint,
  RevoluteJoint,
  SpringJoint,
  WeldJoint,
  WheelJoint,
  WorldInterface,
  BodyInterface,
  ColliderInterface,
} from 'rb-phys2d';

import COLORS from './colors';
import {
  RendererInterface,
  RenderMask,
  StylePresetInterface,
} from './renderer.interface';

const CROSS_SIZE = 0.1;
const POINT_RADIUS = 2;
const ANCHOR_EDGE_SIZE = 8;
const ANCHOR_REV_SIZE = 8;
const SPIRING_COILS = 12;
const SPRINT_WEIGHT = 0.5;

export class Canvas2DRenderer implements RendererInterface {
  private readonly cursor = vec2.create();

  private readonly p0 = vec2.create();

  private readonly p1 = vec2.create();

  private readonly p2 = vec2.create();

  private readonly p3 = vec2.create();

  private readonly t = mat3.create();

  private readonly joints = new Set<JointInterface>();

  private renderMask: number = RenderMask.Default;

  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  private styling: StylePresetInterface = {
    aabbColor: '#ff0000',
    obbColor: '#2200ff',
    staticBodyColor: '#666666',
    sleepingBodyColor: '#AAAAAA',
    anchorColor: '#0356fc',
    contactColor: '#ff0000',
    jointColor: '#f5ad42',
    fontColor: '#666666',
    font: '18px Calibri',
    axesColor: '#3399ff',
  };

  private readonly colors: string[] = COLORS;

  private readonly _projectionMatrix = mat3.create();

  get projectionMatrix(): Readonly<mat3> {
    return this._projectionMatrix;
  }

  of(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.viewport(-15, 15, -20, 10);
  }

  setRenderMask(mask: number): void {
    this.renderMask = mask;
  }

  setStyling(preset: Partial<StylePresetInterface>): void {
    this.styling = { ...this.styling, ...preset };
  }

  clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  viewport(xmin: number, xmax: number, ymin: number, ymax: number): void {
    const { width, height } = this.canvas;
    this.createProjectionMatrix(
      this._projectionMatrix,
      xmin,
      xmax,
      ymin,
      ymax,
      Math.max(width, height),
      Math.max(width, height)
    );
  }

  renderText(text: string, pos: Readonly<vec2>): void {
    this.context.font = this.styling.font;
    this.context.fillStyle = this.styling.fontColor;
    this.project(this.cursor, pos);
    this.context.fillText(text, this.cursor[0], this.cursor[1]);
  }

  renderGrid(lines: number, step: number): void {
    let x = 0;
    let y = 0;
    const edge = -20;

    this.context.strokeStyle = this.styling.axesColor;
    this.context.setLineDash([]);

    for (let i = 0; i < lines; i++) {
      if (i === 0) {
        this.context.lineWidth = 0.75;
        vec2.set(this.p0, -edge, y);
        vec2.set(this.p1, edge, y);
        this.renderLineSegment(this.p0, this.p1);

        vec2.set(this.p0, x, -edge);
        vec2.set(this.p1, x, edge);
        this.renderLineSegment(this.p0, this.p1);
      } else {
        this.context.lineWidth = 0.25;

        vec2.set(this.p0, -edge, y);
        vec2.set(this.p1, edge, y);
        this.renderLineSegment(this.p0, this.p1);

        vec2.set(this.p0, -edge, -y);
        vec2.set(this.p1, edge, -y);
        this.renderLineSegment(this.p0, this.p1);

        vec2.set(this.p0, x, -edge);
        vec2.set(this.p1, x, edge);
        this.renderLineSegment(this.p0, this.p1);

        vec2.set(this.p0, -x, -edge);
        vec2.set(this.p1, -x, edge);
        this.renderLineSegment(this.p0, this.p1);
      }

      x += step;
      y += step;
    }
  }

  renderWorld(world: Readonly<WorldInterface>): void {
    if (this.renderMask & RenderMask.Axes) {
      this.renderGrid(20, 1.0);
    }

    if (this.renderMask & RenderMask.Body) {
      for (const body of world) {
        this.renderBody(body);
      }
    }

    if (this.renderMask & RenderMask.Contact) {
      this.joints.clear();

      for (const body of world) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        for (const contact of body['contacts']) {
          if (this.joints.has(contact)) {
            continue;
          }

          this.renderJoint(contact);
          this.joints.add(contact);
        }
      }
    }

    if (this.renderMask & RenderMask.Joint) {
      this.joints.clear();

      for (const body of world) {
        for (const contact of body.joints) {
          if (this.joints.has(contact)) {
            continue;
          }

          this.renderJoint(contact);
          this.joints.add(contact);
        }
      }
    }

    if (this.renderMask & RenderMask.AABB) {
      for (const body of world) {
        this.renderAABB(body.collider.aabb);
      }
    }

    if (this.renderMask & RenderMask.OBB) {
      for (const body of world) {
        if (body.collider.shape instanceof MeshShape) {
          this.renderOBBTree(body.collider.shape.obbTree);
        }
      }
    }
  }

  renderBody(body: Readonly<BodyInterface>): void {
    const color = body.isStatic
      ? this.styling.staticBodyColor
      : body.isSleeping
      ? this.styling.sleepingBodyColor
      : this.colors[body.islandId % this.colors.length];

    this.context.setLineDash([]);
    this.context.strokeStyle = color;
    this.context.lineWidth = 1.0;

    this.renderCross(body.transform);

    if (body.collider) {
      this.renderCollider(body.collider);
    }
  }

  renderJoint(joint: JointInterface): void {
    if (joint instanceof Contact) {
      this.renderContact(joint);
    } else if (joint instanceof DistanceJoint) {
      this.renderDistanceJoint(joint);
    } else if (joint instanceof MotorJoint) {
      this.renderMotorJoint(joint);
    } else if (joint instanceof MouseJoint) {
      this.renderMouseJoint(joint);
    } else if (joint instanceof PrismaticJoint) {
      this.renderPrismaticJoint(joint);
    } else if (joint instanceof RevoluteJoint) {
      this.renderRevoluteJoint(joint);
    } else if (joint instanceof SpringJoint) {
      this.renderSpring(joint);
    } else if (joint instanceof WeldJoint) {
      this.renderWeldJoint(joint);
    } else if (joint instanceof WheelJoint) {
      this.renderWheelJoint(joint);
    }
  }

  renderAABB(aabb: Readonly<AABB>): void {
    this.context.lineWidth = 0.75;
    this.context.strokeStyle = this.styling.aabbColor;
    this.context.setLineDash([6, 3]);

    const points = [
      vec2.set(this.p0, aabb[0][0], aabb[0][1]),
      vec2.set(this.p1, aabb[1][0], aabb[0][1]),
      vec2.set(this.p2, aabb[1][0], aabb[1][1]),
      vec2.set(this.p3, aabb[0][0], aabb[1][1]),
    ];

    this.context.beginPath();

    let i = 0;
    for (const point of points) {
      this.project(point, point);

      if (i === 0) {
        this.context.moveTo(point[0], point[1]);
      } else {
        this.context.lineTo(point[0], point[1]);
      }

      i++;
    }

    this.context.lineTo(points[0][0], points[0][1]);

    this.context.stroke();
  }

  renderOBB(obb: Readonly<OBB>): void {
    this.context.lineWidth = 0.75;
    this.context.strokeStyle = this.styling.obbColor;
    this.context.setLineDash([1, 1]);

    const points = [
      vec2.set(this.p0, -obb.extent[0], -obb.extent[1]),
      vec2.set(this.p1, obb.extent[0], -obb.extent[1]),
      vec2.set(this.p2, obb.extent[0], obb.extent[1]),
      vec2.set(this.p3, -obb.extent[0], obb.extent[1]),
    ];

    this.context.beginPath();

    let i = 0;
    for (const point of points) {
      vec2.transformMat3(point, point, obb.transform);
      this.project(point, point);

      if (i === 0) {
        this.context.moveTo(point[0], point[1]);
      } else {
        this.context.lineTo(point[0], point[1]);
      }

      i++;
    }

    this.context.lineTo(points[0][0], points[0][1]);
    this.context.stroke();
  }

  renderOBBTree(node: Readonly<OBBNode>, root = 0): void {
    const queue = [{ node, level: 0 }];

    this.context.strokeStyle = this.styling.obbColor;
    this.context.setLineDash([]);

    while (queue.length) {
      const { node, level } = queue.shift();
      if (level >= root || node.payload) {
        this.renderOBB(node.obb);
      }

      for (const child of node.children) {
        queue.push({ node: child, level: level + 1 });
      }
    }
  }

  renderCollider(collider: Readonly<ColliderInterface>): void {
    this.context.setLineDash(collider.body.isSleeping ? [3, 3] : []);

    if (collider.shape instanceof Circle) {
      this.renderCircleShape(collider.shape, collider.transform);
    } else if (collider.shape instanceof Ellipse) {
      this.renderEllipseShape(collider.shape, collider.transform);
    } else if (collider.shape instanceof Capsule) {
      this.renderCapsuleShape(collider.shape, collider.transform);
    } else if (collider.shape instanceof Polygon) {
      this.renderPolyShape(collider.shape, collider.transform);
    } else if (collider.shape instanceof MeshShape) {
      this.renderMeshShape(collider.shape, collider.transform);
    }
  }

  private createProjectionMatrix(
    out: mat3,
    xmin: number,
    xmax: number,
    ymin: number,
    ymax: number,
    width: number,
    height: number
  ) {
    mat3.set(
      out,
      width / (xmax - xmin),
      0,
      0,
      0,
      height / (ymin - ymax),
      0,
      (xmin * Math.max(width, height)) / (xmin - xmax),
      (ymax * Math.max(width, height)) / (ymax - ymin),
      1
    );
  }

  private project(out: vec2, point: Readonly<vec2>): vec2 {
    return vec2.transformMat3(out, point, this._projectionMatrix);
  }

  private renderLineSegment(p0: Readonly<vec2>, p1: Readonly<vec2>) {
    this.context.beginPath();

    this.project(this.cursor, p0);
    this.context.moveTo(this.cursor[0], this.cursor[1]);

    this.project(this.cursor, p1);
    this.context.lineTo(this.cursor[0], this.cursor[1]);

    this.context.stroke();
  }

  private renderCross(transform: Readonly<mat3>) {
    this.context.lineWidth = 1;

    vec2.set(this.p0, -CROSS_SIZE, 0.0);
    vec2.transformMat3(this.p0, this.p0, transform);

    vec2.set(this.p1, CROSS_SIZE, 0.0);
    vec2.transformMat3(this.p1, this.p1, transform);

    this.renderLineSegment(this.p0, this.p1);

    vec2.set(this.p0, 0.0, -CROSS_SIZE);
    vec2.transformMat3(this.p0, this.p0, transform);

    vec2.set(this.p1, 0.0, CROSS_SIZE);
    vec2.transformMat3(this.p1, this.p1, transform);

    this.renderLineSegment(this.p0, this.p1);
  }

  private renderCircleShape(circle: Circle, transform: Readonly<mat3>) {
    vec2.set(this.p0, transform[6], transform[7]);
    this.project(this.p0, this.p0);

    vec2.set(this.p1, circle.radius, 0.0);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      vec2.distance(this.p0, this.p1),
      0,
      2 * Math.PI,
      false
    );
    this.context.stroke();

    this.context.setLineDash([6, 2]);
    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();
  }

  private renderMeshShape(shape: MeshShape, transform: Readonly<mat3>) {
    this.context.beginPath();

    for (const triangle of shape.mesh) {
      for (let i = 0; i < 3; i++) {
        vec2.transformMat3(this.p0, triangle[`p${i}`], transform);
        this.project(this.p0, this.p0);

        vec2.transformMat3(this.p1, triangle[`p${(i + 1) % 3}`], transform);
        this.project(this.p1, this.p1);

        if (i === 0) {
          this.context.moveTo(this.p0[0], this.p0[1]);
        }

        this.context.lineTo(this.p1[0], this.p1[1]);
      }
    }

    this.context.stroke();
  }

  private renderPolyShape(shape: Polygon, transform: Readonly<mat3>) {
    this.context.beginPath();

    let i = 0;
    for (const vertex of shape.vertices()) {
      vec2.set(this.p0, vertex.point[0], vertex.point[1]);
      vec2.transformMat3(this.p0, this.p0, transform);
      this.project(this.p0, this.p0);

      if (i === 0) {
        this.context.moveTo(this.p0[0], this.p0[1]);
      } else {
        this.context.lineTo(this.p0[0], this.p0[1]);
      }

      i++;
    }

    vec2.set(this.p0, shape.loop.point[0], shape.loop.point[1]);
    vec2.transformMat3(this.p0, this.p0, transform);
    this.project(this.p0, this.p0);
    this.context.lineTo(this.p0[0], this.p0[1]);

    this.context.stroke();
  }

  private renderEllipseShape(shape: Ellipse, transform: Readonly<mat3>) {
    vec2.set(this.p0, transform[6], transform[7]);
    this.project(this.p0, this.p0);

    vec2.set(this.p1, 0.0, shape.b);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    const r1 = vec2.dist(this.p0, this.p1);

    vec2.set(this.p1, shape.a, 0.0);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    const r0 = vec2.dist(this.p0, this.p1);

    const angle = -Math.atan2(transform[1], transform[0]);

    // perimeter
    this.context.beginPath();
    this.context.ellipse(
      this.p0[0],
      this.p0[1],
      r0,
      r1,
      angle,
      0,
      2 * Math.PI,
      true
    );
    this.context.stroke();

    // auxiliary
    this.context.setLineDash([6, 2]);
    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();
  }

  private renderCapsuleShape(shape: Capsule, transform: Readonly<mat3>) {
    const angle = -Math.atan2(transform[1], transform[0]);

    // perimeter
    vec2.set(this.p0, 0.0, shape.height * 0.5);
    vec2.transformMat3(this.p0, this.p0, transform);
    this.project(this.p0, this.p0);

    vec2.set(this.p1, shape.r, shape.height * 0.5);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    const radius = vec2.dist(this.p0, this.p1);

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      radius,
      angle,
      angle + Math.PI,
      true
    );
    this.context.stroke();

    vec2.set(this.p0, 0.0, -shape.height * 0.5);
    vec2.transformMat3(this.p0, this.p0, transform);
    this.project(this.p0, this.p0);

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      radius,
      angle,
      angle + Math.PI,
      false
    );
    this.context.stroke();

    vec2.set(this.p0, shape.r, -shape.height * 0.5);
    vec2.transformMat3(this.p0, this.p0, transform);
    this.project(this.p0, this.p0);

    vec2.set(this.p1, shape.r, shape.height * 0.5);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();

    vec2.set(this.p0, -shape.r, -shape.height * 0.5);
    vec2.transformMat3(this.p0, this.p0, transform);
    this.project(this.p0, this.p0);

    vec2.set(this.p1, -shape.r, shape.height * 0.5);
    vec2.transformMat3(this.p1, this.p1, transform);
    this.project(this.p1, this.p1);

    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();
  }

  private renderPoint(point: Readonly<vec2>): void {
    this.context.beginPath();
    this.context.arc(point[0], point[1], POINT_RADIUS, 0, 2 * Math.PI, false);
    this.context.fill();
  }

  private renderTraingle(transform: Readonly<mat3>): void {
    const w = ANCHOR_REV_SIZE * 0.5;
    const h = ANCHOR_REV_SIZE;

    vec2.set(this.p0, w * 0.5, h * 0.5);
    vec2.transformMat3(this.p0, this.p0, transform);

    vec2.set(this.p1, w * -0.5, 0);
    vec2.transformMat3(this.p1, this.p1, transform);

    vec2.set(this.p2, w * 0.5, h * -0.5);
    vec2.transformMat3(this.p2, this.p2, transform);

    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.lineTo(this.p2[0], this.p2[1]);
    this.context.fill();
  }

  private renderContact(contact: Contact): void {
    vec2.copy(this.p0, contact.contactInfo.point0);
    this.project(this.p0, this.p0);

    vec2.sub(this.p1, contact.contactInfo.point0, contact.contactInfo.normal);
    this.project(this.p1, this.p1);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;
    this.context.setLineDash([]);

    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();

    this.context.fillStyle = this.styling.contactColor;
    this.renderPoint(this.p0);
  }

  private renderDistanceJoint(joint: DistanceJoint): void {
    vec2.transformMat3(this.p0, joint.pivotA, joint.bodyA.transform);
    this.project(this.p0, this.p0);

    vec2.transformMat3(this.p1, joint.pivotB, joint.bodyB.transform);
    this.project(this.p1, this.p1);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();

    this.context.lineWidth = 2;
    this.context.beginPath();
    vec2.sub(this.p2, this.p1, this.p0);
    vec2.normalize(this.p2, this.p2);
    vec2.set(this.p2, -this.p2[1], this.p2[0]);
    vec2.scaleAndAdd(this.p3, this.p0, this.p2, ANCHOR_EDGE_SIZE);
    this.context.moveTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p0, this.p2, -ANCHOR_EDGE_SIZE);
    this.context.lineTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p1, this.p2, ANCHOR_EDGE_SIZE);
    this.context.moveTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p1, this.p2, -ANCHOR_EDGE_SIZE);
    this.context.lineTo(this.p3[0], this.p3[1]);
    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;
    this.renderPoint(this.p0);
    this.renderPoint(this.p1);
  }

  private renderMotorJoint(motor: MotorJoint): void {
    vec2.copy(this.p0, motor.bodyA.position);
    this.project(this.p0, this.p0);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.setLineDash([]);
    this.context.lineWidth = 1;

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      ANCHOR_REV_SIZE,
      0,
      2 * Math.PI,
      false
    );
    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;
    this.renderPoint(this.p0);

    this.context.fillStyle = this.styling.jointColor;
    vec2.set(this.p0, this.p0[0], this.p0[1] - ANCHOR_REV_SIZE);
    mat3.fromTranslation(this.t, this.p0);
    this.renderTraingle(this.t);

    vec2.set(this.p0, 0, 2 * ANCHOR_REV_SIZE);
    mat3.translate(this.t, this.t, this.p0);
    mat3.rotate(this.t, this.t, Math.PI);
    this.renderTraingle(this.t);
  }

  private renderMouseJoint(joint: MouseJoint): void {
    vec2.transformMat3(this.p0, joint.joint, joint.bodyA.transform);
    this.project(this.p0, this.p0);

    joint.control.getCursorPosition(this.p1);
    this.project(this.p1, this.p1);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;
    this.context.setLineDash([]);

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      ANCHOR_REV_SIZE,
      0,
      2 * Math.PI,
      false
    );
    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;

    this.renderPoint(this.p0);
    this.renderPoint(this.p1);

    this.context.setLineDash([6, 3]);
    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();
  }

  private renderPrismaticJoint(joint: PrismaticJoint): void {
    // @todo:
    vec2.transformMat3(this.p0, joint.pivotA, joint.bodyA.transform);
    vec2.transformMat3(this.p1, joint.pivotB, joint.bodyB.transform);

    this.project(this.p0, this.p0);
    this.project(this.p1, this.p1);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;
    this.context.setLineDash([3, 4]);
    this.context.beginPath();
    this.context.moveTo(this.p0[0], this.p0[1]);
    this.context.lineTo(this.p1[0], this.p1[1]);
    this.context.stroke();

    this.context.lineWidth = 2;
    this.context.setLineDash([]);
    this.context.beginPath();
    vec2.sub(this.p2, this.p1, this.p0);
    vec2.normalize(this.p2, this.p2);
    vec2.set(this.p2, -this.p2[1], this.p2[0]);
    vec2.scaleAndAdd(this.p3, this.p0, this.p2, ANCHOR_EDGE_SIZE);
    this.context.moveTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p0, this.p2, -ANCHOR_EDGE_SIZE);
    this.context.lineTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p1, this.p2, ANCHOR_EDGE_SIZE);
    this.context.moveTo(this.p3[0], this.p3[1]);
    vec2.scaleAndAdd(this.p3, this.p1, this.p2, -ANCHOR_EDGE_SIZE);
    this.context.lineTo(this.p3[0], this.p3[1]);
    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;
    this.renderPoint(this.p0);
    this.renderPoint(this.p1);
  }

  private renderRevoluteJoint(joint: RevoluteJoint): void {
    vec2.transformMat3(this.p0, joint.pivotA, joint.bodyA.transform);
    this.project(this.p0, this.p0);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      ANCHOR_REV_SIZE,
      0,
      2 * Math.PI,
      false
    );
    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;
    this.renderPoint(this.p0);
  }

  private renderSpring(joint: SpringJoint): void {
    vec2.transformMat3(this.p0, joint.pivotA, joint.bodyA.transform);
    vec2.transformMat3(this.p1, joint.pivotB, joint.bodyB.transform);

    vec2.sub(this.p2, this.p1, this.p0);
    vec2.normalize(this.p2, this.p2);
    vec2.set(this.p3, -this.p2[1], this.p2[0]);

    mat3.set(
      this.t,

      this.p3[0],
      this.p3[1],
      0,

      this.p2[0],
      this.p2[1],
      0,

      this.p0[0],
      this.p0[1],
      1
    );

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;

    this.context.beginPath();

    const dv = vec2.distance(this.p0, this.p1) / SPIRING_COILS;
    let du = SPRINT_WEIGHT;
    let u = 0;
    let v = 0;
    vec2.zero(this.p2);
    for (let i = 0; i <= SPIRING_COILS; i++) {
      vec2.transformMat3(this.p2, this.p2, this.t);
      this.project(this.p2, this.p2);

      if (i === 0) {
        this.context.moveTo(this.p2[0], this.p2[1]);
      } else {
        this.context.lineTo(this.p2[0], this.p2[1]);
      }

      if (i === 0 || i === SPIRING_COILS - 1) {
        u += du * 0.5;
      } else {
        u += du;
      }

      v += dv;
      du = -du;
      vec2.set(this.p2, u, v);
    }

    this.context.stroke();

    this.context.fillStyle = this.styling.anchorColor;

    this.project(this.p0, this.p0);
    this.renderPoint(this.p0);

    this.project(this.p1, this.p1);
    this.renderPoint(this.p1);
  }

  private renderWeldJoint(joint: WeldJoint): void {
    vec2.transformMat3(this.p0, joint.pivotA, joint.bodyA.transform);
    this.project(this.p0, this.p0);

    this.context.strokeStyle = this.styling.jointColor;
    this.context.lineWidth = 1;

    this.context.beginPath();
    this.context.arc(
      this.p0[0],
      this.p0[1],
      ANCHOR_REV_SIZE,
      0,
      2 * Math.PI,
      false
    );
    this.context.moveTo(
      this.p0[0] - ANCHOR_REV_SIZE * Math.SQRT1_2,
      this.p0[1] - ANCHOR_REV_SIZE * Math.SQRT1_2
    );
    this.context.lineTo(
      this.p0[0] + ANCHOR_REV_SIZE * Math.SQRT1_2,
      this.p0[1] + ANCHOR_REV_SIZE * Math.SQRT1_2
    );
    this.context.moveTo(
      this.p0[0] - ANCHOR_REV_SIZE * Math.SQRT1_2,
      this.p0[1] + ANCHOR_REV_SIZE * Math.SQRT1_2
    );
    this.context.lineTo(
      this.p0[0] + ANCHOR_REV_SIZE * Math.SQRT1_2,
      this.p0[1] - ANCHOR_REV_SIZE * Math.SQRT1_2
    );
    this.context.stroke();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  private renderWheelJoint(joint: WheelJoint): void {}
}
