import { mat3, vec2 } from 'gl-matrix';
import {
  Circle,
  DistanceJoint,
  Ellipse,
  JointInterface,
  MeshShape,
  MotorJoint,
  MouseJoint,
  Polygon,
  PrismaticJoint,
  RevoluteJoint,
  Shape,
  SpringJoint,
  WeldJoint,
  WheelJoint,
} from 'rb-phys2d';

import {
  PIVOT_RADIUS,
  JOINT_RADIUS,
  CIRCLE_SEGMENTS,
  CONTACT_NORMAL,
  CROSS_SIZE,
  JOINT_LENGTH,
  JOINT_TICK,
  SPRING_HOOPS,
  SPRING_WEIGHT,
} from './constants';
import { GeometryData } from './device';
import { StylePresetInterface } from './renderer.interface';

export class GeometryFactory {
  static createGrid(
    expansion: number,
    unit: number,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    let u = 0;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let e = 0.0; e <= expansion; e += unit) {
      if (u == 0) {
        indices.push(indices.length);
        vertices.push(-expansion, 0.0, ...preset.axesColor.main);

        indices.push(indices.length);
        vertices.push(expansion, 0.0, ...preset.axesColor.main);

        indices.push(indices.length);
        vertices.push(0.0, -expansion, ...preset.axesColor.main);

        indices.push(indices.length);
        vertices.push(0.0, expansion, ...preset.axesColor.main);
      } else {
        const color =
          u % 10 == 0 ? preset.axesColor.main : preset.axesColor.secondary;

        indices.push(indices.length);
        vertices.push(-expansion, e, ...color);

        indices.push(indices.length);
        vertices.push(expansion, e, ...color);

        indices.push(indices.length);
        vertices.push(-expansion, -e, ...color);

        indices.push(indices.length);
        vertices.push(expansion, -e, ...color);

        indices.push(indices.length);
        vertices.push(e, -expansion, ...color);

        indices.push(indices.length);
        vertices.push(e, expansion, ...color);

        indices.push(indices.length);
        vertices.push(-e, -expansion, ...color);

        indices.push(indices.length);
        vertices.push(-e, expansion, ...color);
      }
      u++;
    }

    return this.createColoredGeometryData(vertices, indices);
  }

  static createCircle(circle: Circle): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];
    const dphi = (2.0 * Math.PI) / CIRCLE_SEGMENTS;

    let phi = 0.0;
    let j = 0;

    while (j < CIRCLE_SEGMENTS) {
      vertices.push(
        Math.cos(phi) * circle.radius,
        Math.sin(phi) * circle.radius
      );

      indices.push(j, (j + 1) % CIRCLE_SEGMENTS);

      phi += dphi;
      j++;
    }

    indices.push(0, j++);
    vertices.push(0, 0);

    this.addCrossVertexData(vertices, indices, j);

    return this.createPlainGeometryData(vertices, indices);
  }

  static createEllipse(ellipse: Ellipse): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];
    const dphi = (2.0 * Math.PI) / CIRCLE_SEGMENTS;

    let phi = 0.0;
    let j = 0;

    while (j < CIRCLE_SEGMENTS) {
      vertices.push(Math.cos(phi) * ellipse.a, Math.sin(phi) * ellipse.b);

      indices.push(j, (j + 1) % CIRCLE_SEGMENTS);

      phi += dphi;
      j++;
    }

    indices.push(0, j++);
    vertices.push(0, 0);

    this.addCrossVertexData(vertices, indices, j);

    return this.createPlainGeometryData(vertices, indices);
  }

  static createPolygon(polygon: Polygon): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];

    let index = 0;

    for (const edge of polygon.edges()) {
      indices.push(index++);
      vertices.push(...edge.v0.point);

      indices.push(index++);
      vertices.push(...edge.v1.point);
    }

    this.addCrossVertexData(vertices, indices, index);

    return this.createPlainGeometryData(vertices, indices);
  }

  static createMesh(mesh: MeshShape): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];

    let index = 0;

    for (const triangle of mesh.mesh) {
      indices.push(index++, index++);
      vertices.push(...triangle.p0, ...triangle.p1);

      indices.push(index++, index++);
      vertices.push(...triangle.p1, ...triangle.p2);

      indices.push(index++, index++);
      vertices.push(...triangle.p2, ...triangle.p0);
    }

    this.addCrossVertexData(vertices, indices, index);

    return this.createPlainGeometryData(vertices, indices);
  }

  static createShape(shape: Shape): GeometryData {
    if (shape instanceof Circle) {
      return this.createCircle(shape);
    } else if (shape instanceof Ellipse) {
      return this.createEllipse(shape);
    } else if (shape instanceof Polygon) {
      return this.createPolygon(shape);
    } else if (shape instanceof MeshShape) {
      return this.createMesh(shape);
    } else {
      return null;
    }
  }

  static createCross(): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];

    this.addCrossVertexData(vertices, indices, 0);

    return this.createPlainGeometryData(vertices, indices);
  }

  static createContactPoint(
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    return this.createColoredGeometryData(
      [
        0,
        0,
        ...preset.contactNormalColor,

        0,
        CONTACT_NORMAL,
        ...preset.contactNormalColor,

        -PIVOT_RADIUS,
        0,
        ...preset.contactPointColor,

        PIVOT_RADIUS,
        0,
        ...preset.contactPointColor,

        0,
        0,
        ...preset.contactPointColor,

        0,
        PIVOT_RADIUS * 1.5,
        ...preset.contactPointColor,
      ],
      [0, 1, 2, 3, 4, 5]
    );
  }

  static createDistanceJoint(
    joint: DistanceJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const indices = [0, 1, 2, 3, 4, 5];

    const vertices = [
      -0.5 * JOINT_TICK,
      0,
      ...preset.jointColor,

      0.5 * JOINT_TICK,
      0,
      ...preset.jointColor,

      -0.5 * JOINT_TICK,
      joint.distance,
      ...preset.jointColor,

      0.5 * JOINT_TICK,
      joint.distance,
      ...preset.jointColor,

      0.0,
      0.0,
      ...preset.jointColor,

      0.0,
      joint.distance,
      ...preset.jointColor,
    ];

    // this.addPivotVertexData(vertices, indices, 6, preset);

    return this.createColoredGeometryData(vertices, indices);
  }

  static createPrismaticJoint(
    joint: PrismaticJoint | WheelJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const indices: number[] = [];
    const vertices: number[] = [];

    const min = joint.minDistance ?? 0;
    const max = isFinite(joint.maxDistance) ? joint.maxDistance : JOINT_LENGTH;

    const transform = mat3.create();
    const y = vec2.create();
    const x = vec2.create();

    vec2.copy(y, joint.localAxis);
    vec2.normalize(y, y);
    vec2.set(x, -y[1], y[0]);

    mat3.set(
      transform,
      x[0],
      x[1],
      0,
      y[0],
      y[1],
      0,
      joint.pivotA[0],
      joint.pivotA[1],
      1.0
    );

    let i = 0;

    if (joint.minDistance) {
      indices.push(i, i + 1);

      const p0 = vec2.fromValues(-0.5 * JOINT_TICK, min);
      vec2.transformMat3(p0, p0, transform);

      const p1 = vec2.fromValues(0.5 * JOINT_TICK, min);
      vec2.transformMat3(p1, p1, transform);

      vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

      i += 2;
    }

    if (isFinite(joint.maxDistance)) {
      indices.push(i, i + 1);

      const p0 = vec2.fromValues(-0.5 * JOINT_TICK, max);
      vec2.transformMat3(p0, p0, transform);

      const p1 = vec2.fromValues(0.5 * JOINT_TICK, max);
      vec2.transformMat3(p1, p1, transform);

      vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

      i += 2;
    }

    indices.push(i, i + 1);

    const p0 = vec2.fromValues(0, min);
    vec2.transformMat3(p0, p0, transform);

    const p1 = vec2.fromValues(0, max);
    vec2.transformMat3(p1, p1, transform);

    vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

    return this.createColoredGeometryData(vertices, indices);
  }

  static createRevoluteJoint(
    joint: RevoluteJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];
    const dphi = (2.0 * Math.PI) / CIRCLE_SEGMENTS;

    let phi = 0.0;
    let j = 0;

    while (j < CIRCLE_SEGMENTS) {
      vertices.push(
        Math.cos(phi) * JOINT_RADIUS,
        Math.sin(phi) * JOINT_RADIUS,
        ...preset.jointColor
      );

      indices.push(j, (j + 1) % CIRCLE_SEGMENTS);

      phi += dphi;
      j++;
    }

    return this.createColoredGeometryData(vertices, indices);
  }

  static createMotorJoint(
    joint: MotorJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];
    const dphi = (2.0 * Math.PI) / CIRCLE_SEGMENTS;

    let phi = 0.0;
    let j = 0;

    while (j < CIRCLE_SEGMENTS) {
      vertices.push(
        Math.cos(phi) * JOINT_RADIUS,
        Math.sin(phi) * JOINT_RADIUS,
        ...preset.jointColor
      );

      indices.push(j, (j + 1) % CIRCLE_SEGMENTS);

      phi += dphi;
      j++;
    }

    indices.push(j, j + 1, j + 2, j + 3, j + 4, j + 5, j + 6, j + 7);

    vertices.push(
      0,
      JOINT_RADIUS,
      ...preset.jointColor,

      0.5 * JOINT_RADIUS,
      1.5 * JOINT_RADIUS,
      ...preset.jointColor,

      0,
      JOINT_RADIUS,
      ...preset.jointColor,

      0.5 * JOINT_RADIUS,
      0.5 * JOINT_RADIUS,
      ...preset.jointColor,

      0,
      -JOINT_RADIUS,
      ...preset.jointColor,

      -0.5 * JOINT_RADIUS,
      -1.5 * JOINT_RADIUS,
      ...preset.jointColor,

      0,
      -JOINT_RADIUS,
      ...preset.jointColor,

      -0.5 * JOINT_RADIUS,
      -0.5 * JOINT_RADIUS,
      ...preset.jointColor
    );

    return this.createColoredGeometryData(vertices, indices);
  }

  static createWeldJoint(
    joint: WeldJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];
    const dphi = (2.0 * Math.PI) / CIRCLE_SEGMENTS;

    let phi = 0.0;
    let j = 0;

    while (j < CIRCLE_SEGMENTS) {
      vertices.push(
        Math.cos(phi) * JOINT_RADIUS,
        Math.sin(phi) * JOINT_RADIUS,
        ...preset.jointColor
      );

      indices.push(j, (j + 1) % CIRCLE_SEGMENTS);

      phi += dphi;
      j++;
    }

    indices.push(j, j + 1, j + 2, j + 3);

    vertices.push(
      -Math.SQRT1_2 * JOINT_RADIUS,
      -Math.SQRT1_2 * JOINT_RADIUS,
      ...preset.jointColor,
      Math.SQRT1_2 * JOINT_RADIUS,
      Math.SQRT1_2 * JOINT_RADIUS,
      ...preset.jointColor,
      Math.SQRT1_2 * JOINT_RADIUS,
      -Math.SQRT1_2 * JOINT_RADIUS,
      ...preset.jointColor,
      -Math.SQRT1_2 * JOINT_RADIUS,
      Math.SQRT1_2 * JOINT_RADIUS,
      ...preset.jointColor
    );

    return this.createColoredGeometryData(vertices, indices);
  }

  static createWheelJoint(
    joint: WheelJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    const indices: number[] = [];
    const vertices: number[] = [];

    const min = joint.minDistance ?? 0;
    const max = isFinite(joint.maxDistance) ? joint.maxDistance : JOINT_LENGTH;

    const transform = mat3.create();
    const y = vec2.create();
    const x = vec2.create();

    vec2.copy(y, joint.localAxis);
    vec2.normalize(y, y);
    vec2.set(x, -y[1], y[0]);

    mat3.set(
      transform,
      x[0],
      x[1],
      0,
      y[0],
      y[1],
      0,
      joint.pivotA[0],
      joint.pivotA[1],
      1.0
    );

    let i = 0;

    if (joint.minDistance) {
      indices.push(i, i + 1);

      const p0 = vec2.fromValues(-0.5 * JOINT_TICK, min);
      vec2.transformMat3(p0, p0, transform);

      const p1 = vec2.fromValues(0.5 * JOINT_TICK, min);
      vec2.transformMat3(p1, p1, transform);

      vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

      i += 2;
    }

    if (isFinite(joint.maxDistance)) {
      indices.push(i, i + 1);

      const p0 = vec2.fromValues(-0.5 * JOINT_TICK, max);
      vec2.transformMat3(p0, p0, transform);

      const p1 = vec2.fromValues(0.5 * JOINT_TICK, max);
      vec2.transformMat3(p1, p1, transform);

      vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

      i += 2;
    }

    indices.push(i, i + 1);

    const p0 = vec2.fromValues(0, min);
    vec2.transformMat3(p0, p0, transform);

    const p1 = vec2.fromValues(0, max);
    vec2.transformMat3(p1, p1, transform);

    vertices.push(...p0, ...preset.jointColor, ...p1, ...preset.jointColor);

    return this.createColoredGeometryData(vertices, indices);
  }

  static createSpring(preset: Readonly<StylePresetInterface>): GeometryData {
    const vertices: number[] = [];
    const indices: number[] = [];

    const dv = 1.0 / SPRING_HOOPS;
    let du = SPRING_WEIGHT;
    let u = 0;
    let v = 0;

    for (let i = 0; i <= SPRING_HOOPS; i++) {
      if (i < SPRING_HOOPS) {
        indices.push(i, i + 1);
      }

      vertices.push(u, v, ...preset.jointColor);

      if (i === 0 || i === SPRING_HOOPS - 1) {
        u += du * 0.5;
      } else {
        u += du;
      }

      v += dv;
      du = -du;
    }

    return this.createColoredGeometryData(vertices, indices);
  }

  static createMouseJoint(
    joint: MouseJoint,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    return this.createColoredGeometryData(
      [0, 0, ...preset.jointColor, 0, 1, ...preset.jointColor],
      [0, 1]
    );
  }

  static createJoint(
    joint: JointInterface,
    preset: Readonly<StylePresetInterface>
  ): GeometryData {
    if (joint instanceof DistanceJoint) {
      return this.createDistanceJoint(joint, preset);
    } else if (joint instanceof PrismaticJoint || joint instanceof WheelJoint) {
      return this.createPrismaticJoint(joint, preset);
    } else if (joint instanceof RevoluteJoint) {
      return this.createRevoluteJoint(joint, preset);
    } else if (joint instanceof WeldJoint) {
      return this.createWeldJoint(joint, preset);
    } else if (joint instanceof SpringJoint) {
      return this.createSpring(preset);
    } else if (joint instanceof MouseJoint) {
      return this.createMouseJoint(joint, preset);
    } else if (joint instanceof MotorJoint) {
      return this.createMotorJoint(joint, preset);
    } else {
      return null;
    }
  }

  static createPivot(preset: Readonly<StylePresetInterface>): GeometryData {
    const vertices = [];
    const indices = [];

    this.addPivotVertexData(vertices, indices, 0, preset);

    return this.createColoredGeometryData(vertices, indices);
  }

  private static addCrossVertexData(
    vertices: number[],
    indices: number[],
    startIndex: number
  ): void {
    indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex + 3);

    vertices.push(
      -0.5 * CROSS_SIZE,
      0,
      0.5 * CROSS_SIZE,
      0,
      0,
      -0.5 * CROSS_SIZE,
      0,
      0.5 * CROSS_SIZE
    );
  }

  private static addPivotVertexData(
    vertices: number[],
    indices: number[],
    startIndex: number,
    preset: Readonly<StylePresetInterface>
  ): void {
    indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex + 3);

    vertices.push(
      -PIVOT_RADIUS * Math.SQRT1_2,
      -PIVOT_RADIUS * Math.SQRT1_2,
      ...preset.anchorColor,
      PIVOT_RADIUS * Math.SQRT1_2,
      PIVOT_RADIUS * Math.SQRT1_2,
      ...preset.anchorColor,
      PIVOT_RADIUS * Math.SQRT1_2,
      -PIVOT_RADIUS * Math.SQRT1_2,
      ...preset.anchorColor,
      -PIVOT_RADIUS * Math.SQRT1_2,
      PIVOT_RADIUS * Math.SQRT1_2,
      ...preset.anchorColor
    );
  }

  private static createPlainGeometryData(
    vertices: number[],
    indices: number[]
  ): GeometryData {
    return {
      vertexFormat: [
        {
          semantics: 'position',
          size: 2,
          type: WebGL2RenderingContext.FLOAT,
          slot: 0,
          offset: 0,
          stride: 8,
        },
      ],
      vertexData: Float32Array.from(vertices),
      indexData: Uint16Array.from(indices),
    };
  }

  private static createColoredGeometryData(
    vertices: number[],
    indices: number[]
  ): GeometryData {
    return {
      vertexFormat: [
        {
          semantics: 'position',
          size: 2,
          type: WebGL2RenderingContext.FLOAT,
          slot: 0,
          offset: 0,
          stride: 24,
        },
        {
          semantics: 'color',
          size: 4,
          type: WebGL2RenderingContext.FLOAT,
          slot: 1,
          offset: 8,
          stride: 24,
        },
      ],
      vertexData: Float32Array.from(vertices),
      indexData: Uint16Array.from(indices),
    };
  }
}
