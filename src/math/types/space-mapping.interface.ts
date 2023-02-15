import { vec2 } from 'gl-matrix';

export interface SpaceMappingInterface {
  toFirstPoint(out: vec2, point: Readonly<vec2>): vec2;
  fromFirstPoint(out: vec2, point: Readonly<vec2>): vec2;
  toFirstVector(out: vec2, vector: Readonly<vec2>): vec2;
  fromFirstVector(out: vec2, vector: Readonly<vec2>): vec2;
  toSecondPoint(out: vec2, point: Readonly<vec2>): vec2;
  fromSecondPoint(out: vec2, point: Readonly<vec2>): vec2;
  toSecondVector(out: vec2, vector: Readonly<vec2>): vec2;
  fromSecondVector(out: vec2, vector: Readonly<vec2>): vec2;
  fromFirstToSecondPoint(out: vec2, point: Readonly<vec2>): vec2;
  fromFirstToSecondVector(out: vec2, vector: Readonly<vec2>): vec2;
  fromSecondToFirstPoint(out: vec2, point: Readonly<vec2>): vec2;
  fromSecondToFirstVector(out: vec2, vector: Readonly<vec2>): vec2;
  inverted(): SpaceMappingInterface;
}
