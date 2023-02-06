import { mat3 } from 'gl-matrix';

import { WorldInterface } from '../../dist/types';

import {
  MOUSE_PICKING_CONTROL_DEFAULTS,
  VIEWPORT_ADJUSTING_CONTROL_DEFAULTS,
} from './constants';
import {
  MousePickingControl,
  MousePickingControlDef,
} from './mouse-picking-control';
import { ortho } from './utils';
import {
  ViewportAdjustingControl,
  ViewportAdjustingControlDef,
} from './viewport-adjusting-control';
import { ViewportInterface } from './viewport.interface';

export class Viewport implements ViewportInterface {
  public readonly projection = mat3.create();

  public readonly context: WebGL2RenderingContext;

  private mousePickingControl: MousePickingControl;

  private viewportAdjustingControl: ViewportAdjustingControl;

  constructor(public readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('webgl2', {
      depth: false,
    });

    this.canvas.style.touchAction = 'none';

    const width = VIEWPORT_ADJUSTING_CONTROL_DEFAULTS.width;
    const aspect = this.canvas.width / this.canvas.height;
    const height = width / aspect;

    ortho(
      this.projection,
      -width * 0.5,
      width * 0.5,
      -height * 0.5,
      height * 0.5
    );
  }

  addMousePickingControl(
    world: Readonly<WorldInterface>,
    options?: Partial<MousePickingControlDef>
  ): ViewportInterface {
    this.mousePickingControl = new MousePickingControl(this, world, {
      ...MOUSE_PICKING_CONTROL_DEFAULTS,
      ...options,
    });

    return this;
  }

  addViewportAdjustingControl(
    options?: Partial<ViewportAdjustingControlDef>
  ): ViewportInterface {
    this.viewportAdjustingControl = new ViewportAdjustingControl(this, {
      ...VIEWPORT_ADJUSTING_CONTROL_DEFAULTS,
      ...options,
    });

    return this;
  }

  destroy(): void {
    if (this.mousePickingControl) {
      this.mousePickingControl.destroy();
      this.mousePickingControl = null;
    }

    if (this.viewportAdjustingControl) {
      this.viewportAdjustingControl.destroy();
      this.viewportAdjustingControl = null;
    }
  }
}
