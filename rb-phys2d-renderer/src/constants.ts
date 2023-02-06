import { vec2, vec4 } from 'gl-matrix';

import { MousePickingControlDef } from './mouse-picking-control';
import { StylePresetInterface } from './renderer.interface';
import { ViewportAdjustingControlDef } from './viewport-adjusting-control';

export const CIRCLE_SEGMENTS = 64;
export const CROSS_SIZE = 0.2;
export const PIVOT_RADIUS = 0.1;
export const SPRING_HOOPS = 12;
export const SPRING_WEIGHT = 0.5;
export const JOINT_RADIUS = 0.2;
export const JOINT_TICK = 0.5;
export const JOINT_LENGTH = 3.0;
export const CONTACT_NORMAL = 1.0;

export const DEFAULT_STYLE_PRESET: StylePresetInterface = {
  backgroundColor: vec4.fromValues(1.0, 1.0, 1.0, 1.0),
  staticBodyColor: vec4.fromValues(0.4, 0.4, 0.4, 1.0),
  sleepingBodyColor: vec4.fromValues(0.0, 0.0, 0.0, 0.25),
  anchorColor: vec4.fromValues(0.01, 0.34, 1.0, 1.0),
  contactPointColor: vec4.fromValues(1.0, 0.0, 0.0, 1.0),
  contactNormalColor: vec4.fromValues(0.96, 0.68, 0.26, 1),
  jointColor: vec4.fromValues(0.96, 0.68, 0.26, 1),
  axesColor: {
    main: vec4.fromValues(0.2, 0.6, 1.0, 1.0),
    secondary: vec4.fromValues(0.8, 0.9, 1.0, 1.0),
  },
};

export const VIEWPORT_ADJUSTING_CONTROL_DEFAULTS: ViewportAdjustingControlDef =
  {
    origin: vec2.create(),
    width: 30,
    minWidth: 2,
    maxWidth: 120,
    zoomStep: 5,
  };

export const MOUSE_PICKING_CONTROL_DEFAULTS: MousePickingControlDef = {
  stiffness: 1.0,
  maxForce: 1.0e4,
};
