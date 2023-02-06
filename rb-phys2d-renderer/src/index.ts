import { WorldInterface } from 'rb-phys2d';

import { RendererInterface } from './renderer.interface';
import { Viewport } from './viewport';
import { ViewportInterface } from './viewport.interface';
import { WorldRenderer } from './world-renderer';

export * from './renderer.interface';
export * from './viewport.interface';

export const createViewport = (
  canvas: Readonly<HTMLCanvasElement>
): ViewportInterface => new Viewport(canvas);

export const destroyViewport = (
  viewport: Readonly<ViewportInterface>
): void => {
  if (viewport instanceof Viewport) {
    viewport.destroy();
  }
};

export const createWorldRenderer = (
  viewport: Readonly<ViewportInterface>,
  world: Readonly<WorldInterface>
): RendererInterface => new WorldRenderer(viewport, world);

export const destroyRenderer = (renderer: Readonly<WorldRenderer>): void => {
  if (renderer instanceof WorldRenderer) {
    renderer.destroy();
  }
};
