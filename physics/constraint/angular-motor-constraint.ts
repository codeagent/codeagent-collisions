import { World } from '../world';
import { Vector } from '../solver';

export class AngularMotorConstraint {
  constructor(
    public readonly world: World,
    public readonly bodyIndex: number,
    public readonly speed: number,
    public readonly torque: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    J[this.bodyIndex * 3] = 0;
    J[this.bodyIndex * 3 + 1] = 0;
    J[this.bodyIndex * 3 + 2] = 1;

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return this.speed;
  }

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}
