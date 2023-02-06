import { vec4 } from 'gl-matrix';

export interface StylePresetInterface {
  backgroundColor: vec4;
  staticBodyColor: vec4;
  sleepingBodyColor: vec4;
  anchorColor: vec4;
  contactPointColor: vec4;
  contactNormalColor: vec4;
  jointColor: vec4;
  axesColor: {
    main: vec4;
    secondary: vec4;
  };
}

export enum RenderMask {
  Axes = 0x1,
  Body = 0x2,
  RevoluteJoint = 0x4,
  WeldJoint = 0x8,
  MouseJoint = 0x10,
  MotorJoint = 0x20,
  Spring = 0x40,
  DistanceJoint = 0x80,
  PrismaticJoint = 0x100,
  WheelJoint = 0x200,
  Contact = 0x400,
  Joint = RevoluteJoint |
    WeldJoint |
    MouseJoint |
    MotorJoint |
    Spring |
    DistanceJoint |
    PrismaticJoint |
    WheelJoint,
  All = Axes | Body | Joint | Contact,
  Default = Axes | Body | Joint,
}

export interface RendererInterface {
  setStyling(preset: StylePresetInterface): void;
  clear(): void;
  render(mask?: RenderMask): void;
  reset(): void;
}
