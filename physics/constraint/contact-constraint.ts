import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';
import { VxV } from '../solver';

export class ContactConstraint extends ConstraintBase {
  private readonly jacobian = new Float32Array(6);
  private readonly velocities = new Float32Array(6);

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly penetration: number
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
    if (bodyAIndex < bodyBIndex) {
      return this.processA(values, columns) + this.processB(values, columns);
    } else {
      return this.processB(values, columns) + this.processA(values, columns);
    }

    let written = 0;
    const x = vec3.create();
    if (!this.bodyA.isStatic) {
      const ra = vec2.create();
      vec2.sub(ra, this.joint, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      // jacobian[bodyAIndex * 3] = -this.normal[0];
      // jacobian[bodyAIndex * 3 + 1] = -this.normal[1];
      // jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];
      if (this.normal[0]) {
        values.push(-this.normal[0]);
        columns.push(bodyAIndex * 3);
        written++;
      }

      if (this.normal[1]) {
        values.push(-this.normal[1]);
        columns.push(bodyAIndex * 3 + 1);
        written++;
      }

      const c = -vec2.cross(x, ra, this.normal)[2];
      if (c) {
        values.push(c);
        columns.push(bodyAIndex * 3 + 2);
        written++;
      }
    }

    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, this.joint, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = this.normal[0];
      // jacobian[bodyBIndex * 3 + 1] = this.normal[1];
      // jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, this.normal)[2];
      // values.push(
      //   this.normal[0],
      //   this.normal[1],
      //   vec2.cross(x, rb, this.normal)[2]
      // );
      // columns.push(bodyBIndex * 3, bodyBIndex * 3 + 1, bodyBIndex * 3 + 2);
      // written += 3;

      if (this.normal[0]) {
        values.push(this.normal[0]);
        columns.push(bodyBIndex * 3);
        written++;
      }

      if (this.normal[1]) {
        values.push(this.normal[1]);
        columns.push(bodyBIndex * 3 + 1);
        written++;
      }

      const c = vec2.cross(x, rb, this.normal)[2];
      if (c) {
        values.push(c);
        columns.push(bodyBIndex * 3 + 2);
        written++;
      }
    }

    return written;
  }

  private processB(values: number[], columns: number[]): number {
    let written = 0;
    const x = vec3.create();
    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, this.joint, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = this.normal[0];
      // jacobian[bodyBIndex * 3 + 1] = this.normal[1];
      // jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, this.normal)[2];
      // values.push(
      //   this.normal[0],
      //   this.normal[1],
      //   vec2.cross(x, rb, this.normal)[2]
      // );
      // columns.push(bodyBIndex * 3, bodyBIndex * 3 + 1, bodyBIndex * 3 + 2);
      // written += 3;

      if (this.normal[0]) {
        values.push(this.normal[0]);
        columns.push(bodyBIndex * 3);
        written++;
      }

      if (this.normal[1]) {
        values.push(this.normal[1]);
        columns.push(bodyBIndex * 3 + 1);
        written++;
      }

      const c = vec2.cross(x, rb, this.normal)[2];
      if (c) {
        values.push(c);
        columns.push(bodyBIndex * 3 + 2);
        written++;
      }
    }

    return written;
  }

  private processA(values: number[], columns: number[]): number {
    let written = 0;
    const x = vec3.create();
    if (!this.bodyA.isStatic) {
      const ra = vec2.create();
      vec2.sub(ra, this.joint, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      // jacobian[bodyAIndex * 3] = -this.normal[0];
      // jacobian[bodyAIndex * 3 + 1] = -this.normal[1];
      // jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];
      if (this.normal[0]) {
        values.push(-this.normal[0]);
        columns.push(bodyAIndex * 3);
        written++;
      }

      if (this.normal[1]) {
        values.push(-this.normal[1]);
        columns.push(bodyAIndex * 3 + 1);
        written++;
      }

      const c = -vec2.cross(x, ra, this.normal)[2];
      if (c) {
        values.push(c);
        columns.push(bodyAIndex * 3 + 2);
        written++;
      }
    }

    return written;
  }

  getPushFactor(dt: number, strength: number): number {
    if (strength) {
      return (this.penetration / dt) * strength;
    } else {
      const x = vec3.create();
      this.jacobian.fill(0);
      this.velocities.fill(0);

      if (!this.bodyA.isStatic) {
        const ra = vec2.create();
        vec2.sub(ra, this.joint, this.bodyA.position);

        this.jacobian[0] = -this.normal[0];
        this.jacobian[1] = -this.normal[1];
        this.jacobian[2] = -vec2.cross(x, ra, this.normal)[2];

        this.velocities[0] = this.bodyA.velocity[0];
        this.velocities[1] = this.bodyA.velocity[1];
        this.velocities[2] = this.bodyA.omega;
      }

      if (!this.bodyB.isStatic) {
        const rb = vec2.create();
        vec2.sub(rb, this.joint, this.bodyB.position);

        this.jacobian[3] = this.normal[0];
        this.jacobian[4] = this.normal[1];
        this.jacobian[5] = vec2.cross(x, rb, this.normal)[2];

        this.velocities[3] = this.bodyB.velocity[0];
        this.velocities[4] = this.bodyB.velocity[1];
        this.velocities[5] = this.bodyB.omega;
      }
    }
    return -VxV(this.jacobian, this.velocities) * this.world.restitution;
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }
}
