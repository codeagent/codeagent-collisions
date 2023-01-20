import { mat3, vec2 } from 'gl-matrix';
import {
  BodyInterface,
  ColliderInterface,
  JointInterface,
  affineInverse,
  cross,
} from 'rb-phys2d';

import { AttributeMask } from '../serializing';

import { WorldProxy } from './world-proxy';

export class BodyProxy implements BodyInterface {
  private readonly r = vec2.create();

  id = 0;

  islandId = 0;

  transform = mat3.create();

  invTransform = mat3.create();

  get position(): Readonly<vec2> {
    return this._position;
  }

  set position(position: Readonly<vec2>) {
    vec2.copy(this._position, position);
    this._attributeMask |= AttributeMask.Position;
  }

  get angle(): number {
    return this._angle;
  }

  set angle(angle: number) {
    this._angle = angle;
    this._attributeMask |= AttributeMask.Angle;
  }

  get velocity(): Readonly<vec2> {
    return this._velocity;
  }

  set velocity(velocity: Readonly<vec2>) {
    vec2.copy(this._velocity, velocity);
    this._attributeMask |= AttributeMask.Velocity;
  }

  get omega(): number {
    return this._omega;
  }

  set omega(omega: number) {
    this._omega = omega;
    this._attributeMask |= AttributeMask.Omega;
  }

  get force(): Readonly<vec2> {
    return this._force;
  }

  set force(force: Readonly<vec2>) {
    vec2.copy(this._force, force);
    this._attributeMask |= AttributeMask.Force;
  }

  get torque(): number {
    return this._torque;
  }

  set torque(torque: number) {
    this._torque = torque;
    this._attributeMask |= AttributeMask.Torque;
  }

  get mass(): number {
    return this._mass;
  }

  set mass(mass: number) {
    this._mass = mass;
    this.invMass = 1.0 / mass;
    this.isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
    this._attributeMask |= AttributeMask.Mass;
  }

  get inertia(): number {
    return this._inertia;
  }

  set inertia(inertia: number) {
    this._inertia = inertia;
    this.invInertia = 1.0 / inertia;
    this.isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
    this._attributeMask |= AttributeMask.Inertia;
  }

  invMass = 0.0;

  invInertia = 0.0;

  isStatic = false;

  isSleeping = false;

  collider: ColliderInterface;

  readonly joints = new Set<Readonly<JointInterface>>();

  readonly contacts = [];

  private _attributeMask: AttributeMask = AttributeMask.None;

  private readonly _position = vec2.create();

  private _angle = 0;

  private readonly _velocity = vec2.create();

  private _omega = 0;

  private readonly _force = vec2.create();

  private _torque = 0.0;

  private _mass = 0.0;

  private _inertia = 0.0;

  constructor(
    public readonly world: WorldProxy,
    public readonly continuous: boolean
  ) {}

  addJoint(joint: JointInterface): void {
    this.joints.add(joint);
  }

  removeJoint(joint: JointInterface): void {
    this.joints.delete(joint);
  }

  updateTransform(): void {
    mat3.fromTranslation(this.transform, this._position);
    mat3.rotate(this.transform, this.transform, this._angle);
    affineInverse(this.invTransform, this.transform);
  }

  applyForce(force: Readonly<vec2>, point?: Readonly<vec2>): void {
    vec2.add(this._force, this._force, force);
    this._attributeMask |= AttributeMask.Force;

    if (point) {
      vec2.transformMat3(this.r, point, this.transform);
      vec2.sub(this.r, this.r, this._position);
      this._torque = cross(this.r, force);
      this._attributeMask |= AttributeMask.Torque;
    }
  }

  clearForces(): void {
    vec2.zero(this._force);
    this.torque = 0.0;
    this._attributeMask |= AttributeMask.Force | AttributeMask.Torque;
  }

  toLocalPoint(out: vec2, global: Readonly<vec2>): vec2 {
    return vec2.transformMat3(out, global, this.invTransform);
  }

  toGlobalPoint(out: vec2, local: Readonly<vec2>): vec2 {
    return vec2.transformMat3(out, local, this.transform);
  }

  getAttributeMask(): AttributeMask {
    return this._attributeMask;
  }

  clearAttributeMask(): void {
    this._attributeMask = AttributeMask.None;
  }
}
