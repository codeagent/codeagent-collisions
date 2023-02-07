import { vec2 } from 'gl-matrix';

import { MaterialDef } from './dynamics';

export interface Settings {
  uid: string;
  gravity: vec2;
  maxBodiesNumber: number;
  maxConstraintsNumber: number;

  // Memory
  totalReservedMemory: number; // in bytes
  defaultMaterial: MaterialDef;
  defaultPushFactor: number;

  // Solver
  solverIterations: number;

  // Island
  islandGenerator: 'local' | 'sole';

  // Contacts
  contactProximityThreshold: number;
  contactConstraintSlop: number;

  // Sleeping
  sleepingVelocityThreshold: number;
  sleepingAngularVelocityThreshold: number;
  fallAsleepTimer: number;

  // CD phase
  broadPhase: 'sap' | 'naive';
  narrowPhase: 'sat' | 'gjk-epa';
  narrowPhaseMargin: number;

  // Toi
  toiSubsteps: number;
  toiEpsilon: number;
  toiPenetrationDepth: number;
  toiMaxIterations: number;

  // Gjk-Epa
  gjkRelError: number;
  gjkMaxIterations: number;
  epaEpsilon: number;
  epaMaxIterations: number;
}

export const defaultSettings: Settings = {
  uid: 'default',
  maxBodiesNumber: 512,
  maxConstraintsNumber: 4096,
  gravity: vec2.fromValues(0.0, -9.8),
  totalReservedMemory: 16e6, // 16mb
  defaultPushFactor: 0.25,
  defaultMaterial: {
    friction: 0.5,
    restitution: 0.5,
    damping: 0.005,
    angularDamping: 0.05,
  },
  solverIterations: 10,
  islandGenerator: 'local',
  contactProximityThreshold: 5e-3, // 5mm
  contactConstraintSlop: 5.0e-3, // 5 mm
  sleepingVelocityThreshold: 1.0e-1, // 0.1 m/s
  sleepingAngularVelocityThreshold: 1.0e-1, // 0.1 rad/s;
  fallAsleepTimer: 0.5,
  broadPhase: 'naive',
  narrowPhase: 'sat',
  narrowPhaseMargin: 1.0e-2, // 1cm
  toiEpsilon: 1.0e-3, // 1mm
  toiPenetrationDepth: 5.0e-2, // 5cm
  toiMaxIterations: 8,
  toiSubsteps: 8,
  gjkRelError: 1.0e-6,
  gjkMaxIterations: 24,
  epaEpsilon: 1.0e-4,
  epaMaxIterations: 24,
};
