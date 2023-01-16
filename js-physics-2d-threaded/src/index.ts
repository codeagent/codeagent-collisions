import { EventDispatcher, WorldInterface } from 'js-physics-2d';
import { Container, ContainerInstance } from 'typedi';

import { WorldProxy } from './proxy';
import { Settings, defaultSettings } from './settings';

export * from './proxy';
export { Settings, defaultSettings };

export const configureContainer = (
  settings: Partial<Settings> = {}
): ContainerInstance => {
  settings = { ...defaultSettings, ...settings };

  const container = Container.of(settings.uid);

  container.set({ id: 'SETTINGS', value: settings });
  container.set({ id: 'WORLD', type: WorldProxy });
  container.set({ id: EventDispatcher, type: EventDispatcher });

  return container;
};

export const createWorld = (
  settings: Partial<Settings> = {}
): WorldInterface => {
  return configureContainer(settings).get('WORLD');
};

export const destroyWorld = (world: WorldInterface) => {
  if (world instanceof WorldProxy) {
    world.terminate();
  }

  world.clear();
  Container.reset(world.settings.uid);
};
