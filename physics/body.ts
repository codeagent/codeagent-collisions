import { mat3, vec2, vec3 } from 'gl-matrix';

export class Body {
  get transform(): mat3 {
    return mat3.clone(this._transform);
  }

  get position() {
    return vec2.clone(this._position);
  }

  set position(position: vec2) {
    vec2.copy(this._position, position);
  }

  get angle() {
    return this._angle;
  }

  set angle(angle: number) {
    this._angle = angle;
  }

  get velocity() {
    return vec2.clone(this._velocity);
  }

  set velocity(velocity: vec2) {
    vec2.copy(this._velocity, velocity);
  }

  get omega() {
    return this._omega;
  }

  set omega(omega: number) {
    this._omega = omega;
  }

  get force(): vec2 {
    return vec2.clone(this._force);
  }

  set force(force: vec2) {
    vec2.copy(this._force, force);
  }

  get torque() {
    return this._torque;
  }

  set torque(torque: number) {
    this._torque = torque;
  }

  get mass() {
    return this._mass;
  }

  get invMass() {
    return this._invMass;
  }

  set mass(mass: number) {
    this._mass = mass;
    this._invMass = 1.0 / mass;
  }

  get inertia() {
    return this._inertia;
  }

  get invInertia() {
    return this._invInertia;
  }

  set inertia(inertia: number) {
    this._inertia = inertia;
    this._invInertia = 1.0 / inertia;
  }

  get isStatic() {
    return !(Number.isFinite(this._mass) || Number.isFinite(this._inertia));
  }

  private readonly _position = vec2.create();
  private readonly _velocity = vec2.create();
  private readonly _force = vec2.create();
  private _angle = 0.0;
  private _omega = 0.0;
  private _torque = 0.0;
  private _mass = 0.0;
  private _invMass = 0.0;
  private _invInertia = 0.0;
  private _inertia = 0.0;

  private readonly _transform = mat3.create();

  constructor(public readonly id: number, public readonly bodyIndex: number) {}

  updateTransform() {
    mat3.fromTranslation(this._transform, this._position);
    mat3.rotate(this._transform, this._transform, this.angle);
  }

  applyForce(force: vec2, point: vec2) {
    this.force = force;
    const r = vec2.create();
    const x = vec3.create();
    vec2.transformMat3(r, point, this.transform);
    vec2.sub(r, r, this._position);
    this.torque = vec2.cross(x, r, force)[2];
  }

  clearForces() {
    vec2.set(this._force, 0.0, 0.0);
    this.torque = 0.0;
  }
}
