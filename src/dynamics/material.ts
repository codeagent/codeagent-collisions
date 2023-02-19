export interface MaterialDef {
  friction?: number;
  restitution?: number;
  damping?: number;
  angularDamping?: number;
}

export class Material {
  constructor(
    readonly friction: number,
    readonly restitution: number,
    readonly damping: number,
    readonly angularDamping: number
  ) {}
}
