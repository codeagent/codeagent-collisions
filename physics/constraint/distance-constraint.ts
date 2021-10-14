import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';

export class DistanceConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyAIndex: number,
    public readonly jointA: vec2,
    public readonly bodyBIndex: number,
    public readonly jointB: vec2,
    public readonly distance: number
  ) {
    super();
  }

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const ra = vec2.create();
    vec2.sub(ra, pa, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, pb, bodyB.position);

    const pbpa = vec2.create();
    vec2.sub(pbpa, pb, pa);
    vec2.normalize(pbpa, pbpa);
    const x = vec3.create();

    J[this.bodyAIndex * 3] = -pbpa[0];
    J[this.bodyAIndex * 3 + 1] = -pbpa[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, pbpa)[2];

    J[this.bodyBIndex * 3] = pbpa[0];
    J[this.bodyBIndex * 3 + 1] = pbpa[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, pbpa)[2];

    return J;
  }

  getPushFactor(dt: number, strength = 1.0): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    return ((this.distance - vec2.distance(pb, pa)) * strength) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}
