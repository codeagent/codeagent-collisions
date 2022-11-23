import { Container, ContainerInstance } from 'typedi';

import { defaultSettings, Settings } from './settings';
import {
  LocalIslandsGenerator,
  SoleIslandGenerator,
  ConstraintsSolver,
} from './dynamics';

import {
  BruteForceBroadPhase,
  DefaultMidPhase,
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
  container.set({ id: 'BROAD_PHASE', type: BruteForceBroadPhase });
  container.set({ id: 'MID_PHASE', type: DefaultMidPhase });
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
