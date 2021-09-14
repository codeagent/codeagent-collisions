import { World } from '../world';
import { Vector } from '../solver';
import { vec2, vec3 } from 'gl-matrix';

export class SpringConstraint {
  constructor(
    public world: World,
    public bodyAIndex: number,
    public jointA: vec2,
    public bodyBIndex: number,
    public jointB: vec2,
    public length: number,
    public stiffness: number,
    public extinction: number
  ) {}

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

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
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

    const n = vec2.create();
    vec2.sub(n, pb, pa);
    const distance = vec2.length(n);
    vec2.scale(n, n, 1.0 / distance);

    const va = vec2.clone(bodyA.velocity);
    vec2.scaleAndAdd(va, va, vec2.fromValues(-ra[1], ra[0]), bodyA.omega);

    const vb = vec2.clone(bodyB.velocity);
    vec2.scaleAndAdd(vb, vb, vec2.fromValues(-rb[1], rb[0]), bodyB.omega);

    // Damping force
    const fd = this.extinction * (vec2.dot(n, va) - vec2.dot(n, vb));

    // Stiff force
    const fs = this.stiffness * (this.length - distance);

    const c = fs + fd;

    return { min: c, max: c };
  }
}
