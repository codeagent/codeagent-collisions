import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { transformMat3Vec } from '../collision/utils';

export class LineConstraint {
  constructor(
    public readonly world: World,
    public readonly bodyAIndex: number,
    public readonly jointA: vec2,
    public readonly bodyBIndex: number,
    public readonly jointB: vec2,
    public readonly axisA: vec2
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const t = vec2.create();
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      bodyA.transform
    );

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const u = vec2.create();
    vec2.sub(u, pb, pa);

    const ra = vec2.create();
    vec2.sub(ra, pa, bodyA.position);
    vec2.sub(ra, ra, u);

    const rb = vec2.create();
    vec2.sub(rb, pb, bodyB.position);

    const x = vec3.create();

    J[this.bodyAIndex * 3] = -t[0];
    J[this.bodyAIndex * 3 + 1] = -t[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, t)[2];

    J[this.bodyBIndex * 3] = t[0];
    J[this.bodyBIndex * 3 + 1] = t[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, t)[2];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const t = vec2.create();
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      bodyA.transform
    );

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const u = vec2.create();
    vec2.sub(u, pb, pa);

    return (vec2.dot(t, u) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}
