import { mat3, vec2 } from 'gl-matrix';

import { Collider } from '../cd';
import { Events } from '../events';
import { affineInverse, cross } from '../math';

import { Contact } from './joint';
import { BodyInterface, JointInterface } from './types';
import { World } from './world';

export class Body implements BodyInterface {
  omega = 0;

  angle = 0;

  collider: Collider;

  bodyIndex = -1; // index in host island

  islandId = -1; // id of host island

  readonly joints = new Set<JointInterface>();

  readonly contacts = new Set<Contact>();

  readonly solverConstraints: number[] = []; // the list of constraints in island with witch given body will be interacted

  private readonly _position = vec2.create();

  private readonly _velocity = vec2.create();

  private readonly _force = vec2.create();

  private _torque = 0.0;

  private _mass = 0.0;

  private _invMass = 0.0;

  private _invInertia = 0.0;

  private _inertia = 0.0;

  private _isStatic = false;

  private _isSleeping = false;

  private _sleepTimer = 0;

  private readonly _transform = mat3.create();

  private readonly _invTransform = mat3.create();

  constructor(
    readonly id: number,
    readonly world: World,
    readonly continuous: boolean
  ) {}

  get velocity(): Readonly<vec2> {
    return this._velocity;
  }

  get force(): Readonly<vec2> {
    return this._force;
  }

  get torque(): number {
    return this._torque;
  }

  get invMass(): number {
    return this._invMass;
  }

  get mass(): number {
    return this._mass;
  }

  get invInertia(): number {
    return this._invInertia;
  }

  get inertia(): number {
    return this._inertia;
  }

  get isStatic(): boolean {
    return this._isStatic;
  }

  get isSleeping(): boolean {
    return this._isSleeping;
  }

  get transform(): Readonly<mat3> {
    return this._transform;
  }

  get invTransform(): Readonly<mat3> {
    return this._invTransform;
  }

  get position(): Readonly<vec2> {
    return this._position;
  }

  set position(position: Readonly<vec2>) {
    vec2.copy(this._position, position);
  }

  set velocity(velocity: Readonly<vec2>) {
    vec2.copy(this._velocity, velocity);
  }

  set force(force: Readonly<vec2>) {
    vec2.copy(this._force, force);
  }

  set torque(torque: number) {
    this._torque = torque;
  }

  set mass(mass: number) {
    this._mass = mass;
    this._invMass = 1.0 / mass;
    this._isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
  }

  set inertia(inertia: number) {
    this._inertia = inertia;
    this._invInertia = 1.0 / inertia;
    this._isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
  }

  addJoint(joint: JointInterface): void {
    this.joints.add(joint);
    this.awake();
  }

  removeJoint(joint: JointInterface): void {
    this.joints.delete(joint);
    this.awake();
  }

  addContact(contact: Contact): void {
    this.contacts.add(contact);
    this.awake();
  }

  removeContact(contact: Contact): void {
    this.contacts.delete(contact);
    this.awake();
  }

  updateTransform(): void {
    mat3.fromTranslation(this._transform, this._position);
    mat3.rotate(this._transform, this._transform, this.angle);
    affineInverse(this._invTransform, this._transform);
  }

  applyForce(force: Readonly<vec2>, point?: Readonly<vec2>): void {
    vec2.add(this._force, this._force, force);

    if (point) {
      const r = vec2.create();
      vec2.transformMat3(r, point, this.transform);
      vec2.sub(r, r, this._position);
      this._torque = cross(r, force);
    }

    this.awake();
  }

  clearForces(): void {
    vec2.zero(this._force);
    this._torque = 0.0;
  }

  toLocalPoint(out: vec2, global: Readonly<vec2>): vec2 {
    return vec2.transformMat3(out, global, this._invTransform);
  }

  toGlobalPoint(out: vec2, local: Readonly<vec2>): vec2 {
    return vec2.transformMat3(out, local, this._transform);
  }

  tick(dt: number): void {
    if (!this.isStatic) {
      const speed = vec2.length(this.velocity);
      const angularSpeed = Math.abs(this.omega);

      if (
        speed <= this.world.settings.sleepingVelocityThreshold &&
        angularSpeed <= this.world.settings.sleepingAngularVelocityThreshold
      ) {
        this._sleepTimer -= dt;

        if (this._sleepTimer <= 0) {
          this.fallAsleep();
        }
      } else {
        this.awake();
      }
    }
  }

  private awake(): void {
    if (this._isSleeping) {
      this.world.dispatch(Events.Awake, this);
    }

    this._isSleeping = false;
    this._sleepTimer = this.world.settings.fallAsleepTimer;
  }

  private fallAsleep(): void {
    if (!this._isSleeping) {
      this.world.dispatch(Events.FallAsleep, this);
    }

    this._isSleeping = true;
  }
}
