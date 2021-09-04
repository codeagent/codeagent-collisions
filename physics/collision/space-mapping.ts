import { mat3, vec2 } from 'gl-matrix';

import { transformMat3Vec, affineInverse } from './utils';

export interface SpaceMappingInterface {
  toFirstPoint(out: vec2, point: vec2): vec2;
  fromFirstPoint(out: vec2, point: vec2): vec2;
  toFirstVector(out: vec2, vector: vec2): vec2;
  fromFirstVector(out: vec2, vector: vec2): vec2;
  toSecondPoint(out: vec2, point: vec2): vec2;
  fromSecondPoint(out: vec2, point: vec2): vec2;
  toSecondVector(out: vec2, vector: vec2): vec2;
  fromSecondVector(out: vec2, vector: vec2): vec2;
  fromFirstToSecondPoint(out: vec2, point: vec2): vec2;
  fromFirstToSecondVector(out: vec2, vector: vec2): vec2;
  fromSecondToFirstPoint(out: vec2, point: vec2): vec2;
  fromSecondToFirstVector(out: vec2, vector: vec2): vec2;
}

export class SpaceMapping implements SpaceMappingInterface {
  private readonly invFirst = mat3.create();
  private readonly invSecond = mat3.create();
  private readonly invFirstSecond = mat3.create();
  private readonly invSecondFirst = mat3.create();

  constructor(private readonly first: mat3, private readonly second: mat3) {
    // @todo: affineInverse
    mat3.invert(this.invFirst, first);
    mat3.invert(this.invSecond, second);
    mat3.multiply(this.invFirstSecond, this.invFirst, second);
    mat3.multiply(this.invSecondFirst, this.invSecond, first);
  }

  toFirstPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.invFirst);
  }
  fromFirstPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.first);
  }
  toFirstVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.invFirst);
  }
  fromFirstVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.first);
  }
  toSecondPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.invSecond);
  }
  fromSecondPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.second);
  }
  toSecondVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.invSecond);
  }
  fromSecondVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.second);
  }
  fromFirstToSecondPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.invSecondFirst);
  }
  fromFirstToSecondVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.invSecondFirst);
  }
  fromSecondToFirstPoint(out: vec2, point: vec2): vec2 {
    return vec2.transformMat3(out, point, this.invFirstSecond);
  }
  fromSecondToFirstVector(out: vec2, vector: vec2): vec2 {
    return transformMat3Vec(out, vector, this.invFirstSecond);
  }
}

export class InverseSpaceMappingDecorator implements SpaceMappingInterface {
  constructor(private readonly mapping: SpaceMappingInterface) {}

  toFirstPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.toSecondPoint(out, point);
  }
  fromFirstPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.fromSecondPoint(out, point);
  }
  toFirstVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.toSecondVector(out, vector);
  }
  fromFirstVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.fromSecondVector(out, vector);
  }
  toSecondPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.toFirstPoint(out, point);
  }
  fromSecondPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.fromFirstPoint(out, point);
  }
  toSecondVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.toFirstVector(out, vector);
  }
  fromSecondVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.fromFirstVector(out, vector);
  }
  fromFirstToSecondPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.fromSecondToFirstPoint(out, point);
  }
  fromFirstToSecondVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.fromSecondToFirstVector(out, vector);
  }
  fromSecondToFirstPoint(out: vec2, point: vec2): vec2 {
    return this.mapping.fromFirstToSecondPoint(out, point);
  }
  fromSecondToFirstVector(out: vec2, vector: vec2): vec2 {
    return this.mapping.fromFirstToSecondVector(out, vector);
  }
}

export const inverse = (
  spaceMapping: SpaceMappingInterface
): SpaceMappingInterface => new InverseSpaceMappingDecorator(spaceMapping);
