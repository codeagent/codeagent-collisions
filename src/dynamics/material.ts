export interface MaterialDef {
  friction?: number;
  restitution?: number;
  damping?: number;
  angularDamping?: number;
}

export class Material {
  public constructor(
    public readonly friction: number,
    public readonly restitution: number,
    public readonly damping: number,
    public readonly angularDamping: number
  ) {}
}
