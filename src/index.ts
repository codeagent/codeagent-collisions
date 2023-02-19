import 'reflect-metadata';
import { Container } from 'typedi';

import { configureContainer } from './di';
import { WorldInterface } from './dynamics';
import { Settings } from './settings';

export * from './cd';
export * from './dynamics';
export * from './math';
export * from './utils';
export * from './settings';
export * from './di';
export * from './events';

export const createWorld = (
  settings: Partial<Settings> = {}
): WorldInterface => {
  return configureContainer(settings).get('WORLD');
};

export const destroyWorld = (world: WorldInterface): Container => {
  world.clear();
  return Container.reset(world.settings.uid);
};
