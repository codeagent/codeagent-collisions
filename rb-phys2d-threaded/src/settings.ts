import {
  Settings as BaseSettings,
  defaultSettings as defaultBaseSettings,
} from 'rb-phys2d';

export interface Settings extends BaseSettings {
  // World's step size in seconds. If 'animationFrame' given the requestAnimationFrame will be used with 60 fps
  step: number | 'animationFrame';

  // Path to web worker url. If not provided default will be used
  workerUrl: string;
}

export const defaultSettings: Settings = {
  ...defaultBaseSettings,
  step: 0.01667,
  workerUrl: '',
};
