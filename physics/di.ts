import { Container, ContainerInstance, Token } from 'typedi';

export const SETTINGS = new Token<Settings>('SETTINGS');
export const BROAD_PHASE = new Token<BroadPhaseInterface>('BROAD_PHASE');
export const MID_PHASE = new Token<MidPhaseInterface>('MID_PHASE');
export const NARROW_PHASE = new Token<NarrowPhaseInterface>('NARROW_PHASE');
export const ISLANDS_GENERATOR = new Token<IslandsGeneratorInterface>(
  'ISLANDS_GENERATOR'
);

import {
  IslandsGeneratorInterface,
  LocalIslandsGenerator,
  SoleIslandGenerator,
} from './dynamics';

import { Settings } from './settings';

import {
  BroadPhaseInterface,
  BruteForceBroadPhase,
  DefaultMidPhase,
  GjkEpaNarrowPhase,
  MidPhaseInterface,
  NarrowPhaseInterface,
  SatNarrowPhase,
} from './cd';

export const configureContainer = (settings: Settings): ContainerInstance => {
  const container = Container.of(settings.uid);

  if (settings.broadPhase === 'default') {
    container.set({ id: BROAD_PHASE, type: BruteForceBroadPhase });
  } else {
    throw new Error('Physics2D: Unknown broad phase identifier');
  }

  if (settings.midPhase === 'default') {
    container.set({ id: MID_PHASE, type: DefaultMidPhase });
  } else {
    throw new Error('Physics2D: Unknown mid phase identifier');
  }

  if (settings.narrowPhase === 'sat') {
    container.set({ id: NARROW_PHASE, type: SatNarrowPhase });
  } else if (settings.narrowPhase === 'gjk-epa') {
    container.set({ id: NARROW_PHASE, type: GjkEpaNarrowPhase });
  } else {
    throw new Error(
      "Physics2D: Unknown narrow phase identifier, supported keys: 'sat', 'gjk-epa'"
    );
  }

  if (settings.islandGenerator === 'local') {
    container.set({ id: ISLANDS_GENERATOR, type: LocalIslandsGenerator });
  } else if (settings.islandGenerator === 'sole') {
    container.set({ id: ISLANDS_GENERATOR, type: SoleIslandGenerator });
  } else {
    throw new Error(
      "Physics2D: Unknown island generator identifier, supported keys: 'local', 'sole'"
    );
  }

  container.set({ id: SETTINGS, value: settings });

  return container;
};
