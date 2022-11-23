import 'reflect-metadata';
import { Container } from 'typedi';

import { configureContainer } from './di';
import { World } from './dynamics';
import { Settings } from './settings';

export * from './cd';
export * from './dynamics';
export * from './math';
export * from './utils';
export * from './settings';
export * from './di';

export const createWorld = (settings: Partial<Settings> = {}): World => {
  return configureContainer(settings).get(World);
};

export const destroyWorld = (world: World) => {
  world.dispose();
  Container.reset(world.settings.uid);
};
