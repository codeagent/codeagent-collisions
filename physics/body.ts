import { mat3, vec2 } from "gl-matrix";

import { cross } from "./tests";
import { World } from "./world";

const ZERO = vec2.fromValues(0.0, 0.0);

export class Body {
  get transform(): mat3 {
    return this._transform;
  }

  get position() {
    return vec2.fromValues(
      this.world.positions[this.bodyIndex * 3],
      this.world.positions[this.bodyIndex * 3 + 1]
    );
  }

  set position(position: vec2) {
    this.world.positions[this.bodyIndex * 3] = position[0];
    this.world.positions[this.bodyIndex * 3 + 1] = position[1];
  }

  get angle() {
    return this.world.positions[this.bodyIndex * 3 + 2];
  }

  set angle(angle: number) {
    this.world.positions[this.bodyIndex * 3 + 2] = angle;
  }

  get velocity() {
    return vec2.fromValues(
      this.world.velocities[this.bodyIndex * 3],
      this.world.velocities[this.bodyIndex * 3 + 1]
    );
  }

  set velocity(velocity: vec2) {
    this.world.velocities[this.bodyIndex * 3] = velocity[0];
    this.world.velocities[this.bodyIndex * 3 + 1] = velocity[1];
  }

  get omega() {
    return this.world.velocities[this.bodyIndex * 3 + 2];
  }

  set omega(omega: number) {
    this.world.velocities[this.bodyIndex * 3 + 2] = omega;
  }

  get force(): vec2 {
    return vec2.fromValues(
      this.world.forces[this.bodyIndex * 3],
      this.world.forces[this.bodyIndex * 3 + 1]
    );
  }

  set force(force: vec2) {
    this.world.forces[this.bodyIndex * 3] = force[0];
    this.world.forces[this.bodyIndex * 3 + 1] = force[1];
  }

  get torque() {
    return this.world.forces[this.bodyIndex * 3 + 2];
  }

  set torque(torque: number) {
    this.world.forces[this.bodyIndex * 3 + 2] = torque;
  }

  get mass() {
    return 1.0 / this.world.invMasses[this.bodyIndex * 3];
  }

  set mass(mass: number) {
    this.world.invMasses[this.bodyIndex * 3] = 1.0 / mass;
    this.world.invMasses[this.bodyIndex * 3 + 1] = 1.0 / mass;
  }

  get itertia() {
    return 1.0 / this.world.invMasses[this.bodyIndex * 3 + 2];
  }

  set itertia(itertia: number) {
    this.world.invMasses[this.bodyIndex * 3 + 2] = 1.0 / itertia;
  }

  private _transform = mat3.create();

  constructor(
    private readonly world: World,
    public readonly bodyIndex: number
  ) {}

  updateTransform() {
    mat3.fromTranslation(this._transform, this.position);
    mat3.rotate(this._transform, this._transform, this.angle);
  }

  applyForce(force: vec2, point: vec2) {
    this.force = force;
    const r = vec2.create();
    vec2.transformMat3(r, point, this.transform);
    vec2.sub(r, r, this.position);
    this.torque = cross(r, force);
  }

  clearForces() {
    this.force = ZERO;
    this.torque = 0.0;
  }
}
