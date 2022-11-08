import { vec2 } from 'gl-matrix';

export interface Settings {
  uid: string;
  gravity: vec2;

  // Default (todo: material)
  defaultPushFactor: number;
  defaultFriction: number;
  defaultRestitution: number;
  defaultDamping: number; // todo:
  defaultAngularDamping: number; // todo:

  // Solver
  solver: 'gauss-seidel';
  solverIterations: number;

  // Island
  islandGenerator: 'local' | 'sole';
  islandReservedMemory: number;

  // Contacts
  contactProximityThreshold: number;
  contactConstraintSlop: number;

  // Sleeping
  sleepingVelocityThreshold: number;
  sleepingAngularVelocityThreshold: number;
  fallAsleepTimer: number;

  // CD phase
  broadPhase: 'default';
  midPhase: 'default';
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
  gravity: vec2.fromValues(0.0, -9.8),
  defaultPushFactor: 0.25,
  defaultFriction: 0.5,
  defaultRestitution: 0.5,
  defaultDamping: 0.005,
  defaultAngularDamping: 0.05,
  solver: 'gauss-seidel',
  solverIterations: 10,
  islandGenerator: 'local',
  islandReservedMemory: 5e6, // 5mb
  contactProximityThreshold: 5e-3, // 5mm
  contactConstraintSlop: 5.0e-3, // 5 mm
  sleepingVelocityThreshold: 1.0e-1, // 0.1 m/s
  sleepingAngularVelocityThreshold: 1.0e-1, // 0.1 rad/s;
  fallAsleepTimer: 0.5,
  broadPhase: 'default',
  midPhase: 'default',
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
