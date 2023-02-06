import { mat3, vec2 } from 'gl-matrix';
import { WorldInterface } from 'rb-phys2d';

import { MousePickingControlDef } from './mouse-picking-control';
import { ViewportAdjustingControlDef } from './viewport-adjusting-control';

export interface ViewportInterface {
  readonly projection: mat3;
  readonly canvas: HTMLCanvasElement;
  readonly context: WebGL2RenderingContext;

  addMousePickingControl(
    world: Readonly<WorldInterface>,
    options?: Partial<MousePickingControlDef>
  ): ViewportInterface;

  addViewportAdjustingControl(
    options?: Partial<ViewportAdjustingControlDef>
  ): ViewportInterface;
}
