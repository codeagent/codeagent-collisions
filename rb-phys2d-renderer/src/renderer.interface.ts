import { mat3, vec2 } from 'gl-matrix';
import {
  AABB,
  JointInterface,
  OBB,
  Collider,
  OBBNode,
  WorldInterface,
  BodyInterface,
} from 'rb-phys2d';

export interface StylePresetInterface {
  aabbColor: string;
  obbColor: string;
  staticBodyColor: string;
  sleepingBodyColor: string;
  anchorColor: string;
  contactColor: string;
  jointColor: string;
  font: string;
  fontColor: string;
  axesColor: string;
}

export enum RenderMask {
  Text = 0x01,
  Axes = 0x02,
  Body = 0x04,
  Joint = 0x08,
  Contact = 0x10,
  AABB = 0x20,
  OBB = 0x40,
  All = RenderMask.Text |
    RenderMask.Axes |
    RenderMask.Body |
    RenderMask.Joint |
    RenderMask.Contact |
    RenderMask.AABB |
    RenderMask.OBB,
  Default = RenderMask.Text |
    RenderMask.Axes |
    RenderMask.Body |
    RenderMask.Joint,
}

export interface RendererInterface {
  readonly projectionMatrix: Readonly<mat3>;

  setStyling(preset: StylePresetInterface): void;
  setRenderMask(mask: number): void;
  clear(): void;
  viewport(xmin: number, xmax: number, ymin: number, ymax: number): void;
  renderText(text: string, pos: Readonly<vec2>): void;
  renderGrid(lines: number, step: number): void;
  renderWorld(world: Readonly<WorldInterface>): void;
  renderBody(body: Readonly<BodyInterface>): void;
  renderJoint(joint: JointInterface): void;
  renderAABB(aabb: Readonly<AABB>): void;
  renderOBB(obb: Readonly<OBB>): void;
  renderOBBTree(obb: Readonly<OBBNode>, root: number): void;
  renderCollider(collider: Readonly<Collider>): void;
  of(canvas: HTMLCanvasElement): void;
}
