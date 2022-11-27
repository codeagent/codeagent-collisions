import { Container, ContainerInstance } from 'typedi';

import { defaultSettings, Settings } from './settings';
import {
  LocalIslandsGenerator,
  SoleIslandGenerator,
  ConstraintsSolver,
} from './dynamics';

import {
  NaiveBroadPhase,
  SapBroadPhase,
  MidPhase,
  GjkEpaNarrowPhase,
  SatNarrowPhase,
} from './cd';
import { GaussSeidelSolver } from './math';

export const configureContainer = (
  settings: Partial<Settings> = {}
): ContainerInstance => {
  settings = { ...defaultSettings, ...settings };

  const container = Container.of(settings.uid);

  container.set({ id: 'SETTINGS', value: settings });
  container.set({ id: 'MID_PHASE', type: MidPhase });
  container.set({ id: 'CONSTRAINTS_SOLVER', type: ConstraintsSolver });
  container.set({ id: 'LINEAR_EQUATIONS_SOLVER', type: GaussSeidelSolver });

  if (settings.narrowPhase === 'sat') {
    container.set({ id: 'NARROW_PHASE', type: SatNarrowPhase });
  } else if (settings.narrowPhase === 'gjk-epa') {
    container.set({ id: 'NARROW_PHASE', type: GjkEpaNarrowPhase });
  } else {
    throw new Error(
      "Physics2D: Unknown narrow phase identifier, supported keys: 'sat', 'gjk-epa'"
    );
  }

  if (settings.broadPhase === 'naive') {
    container.set({ id: 'BROAD_PHASE', type: NaiveBroadPhase });
  } else if (settings.broadPhase === 'sap') {
    container.set({ id: 'BROAD_PHASE', type: SapBroadPhase });
  } else {
    throw new Error(
      "Physics2D: Unknown broad phase identifier, supported keys: 'naive', 'sap'"
    );
  }

  if (settings.islandGenerator === 'local') {
    container.set({ id: 'ISLANDS_GENERATOR', type: LocalIslandsGenerator });
  } else if (settings.islandGenerator === 'sole') {
    container.set({ id: 'ISLANDS_GENERATOR', type: SoleIslandGenerator });
  } else {
    throw new Error(
      "Physics2D: Unknown island generator identifier, supported keys: 'local', 'sole'"
    );
  }

  return container;
};
