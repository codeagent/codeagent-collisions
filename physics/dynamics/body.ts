import { mat3, vec2, vec3 } from 'gl-matrix';
import { JointInterface } from '../';
import { Collider } from '../cd';
import { affineInverse } from '../math';
import { Contact } from './joint';
import { World } from './world';

export class Body {
  get transform(): Readonly<mat3> {
    return this._transform;
  }

  get invTransform(): Readonly<mat3> {
    return this._transform;
  }

  get position(): Readonly<vec2> {
    return this._position;
  }

  set position(position: Readonly<vec2>) {
    vec2.copy(this._position, position);
  }

  get angle(): number {
    return this._angle;
  }

  set angle(angle: number) {
    this._angle = angle;
  }

  get velocity(): Readonly<vec2> {
    return this._velocity;
  }

  set velocity(velocity: Readonly<vec2>) {
    vec2.copy(this._velocity, velocity);
  }

  get omega(): number {
    return this._omega;
  }

  set omega(omega: number) {
    this._omega = omega;
  }

  get force(): Readonly<vec2> {
    return this._force;
  }

  set force(force: Readonly<vec2>) {
    vec2.copy(this._force, force);
  }

  get torque(): number {
    return this._torque;
  }

  set torque(torque: number) {
    this._torque = torque;
  }

  get mass(): number {
    return this._mass;
  }

  get invMass(): number {
    return this._invMass;
  }

  set mass(mass: number) {
    this._mass = mass;
    this._invMass = 1.0 / mass;
    this._isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
  }

  get inertia(): number {
    return this._inertia;
  }

  get invInertia(): number {
    return this._invInertia;
  }

  set inertia(inertia: number) {
    this._inertia = inertia;
    this._invInertia = 1.0 / inertia;
    this._isStatic =
      !Number.isFinite(this._mass) && !Number.isFinite(this._inertia);
  }

  get isStatic(): boolean {
    return this._isStatic;
  }

  get joints(): Set<JointInterface> {
    return this._joints;
  }

  get contacts(): Set<Contact> {
    return this._contacts;
  }

  get isSleeping(): boolean {
    return this._isSleeping;
  }

  public collider: Collider;
  public bodyIndex: number = -1; // index in host island
  public islandId: number = -1; // id of host island
  public readonly islandJacobians: number[] = []; // the list of constraints in island with witch given body will be interacted

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
  private _isStatic = false;
  private _isSleeping = false;
  private _sleepTimer = 0;

  private readonly _transform = mat3.create();
  private readonly _invTransform = mat3.create();
  private readonly _joints = new Set<JointInterface>();
  private readonly _contacts = new Set<Contact>();

  constructor(
    public readonly id: number,
    public readonly world: World,
    public readonly continuous: boolean
  ) {}

  addJoint(joint: JointInterface) {
    this._joints.add(joint);
    this.awake();
  }

  removeJoint(joint: JointInterface) {
    this._joints.delete(joint);
    this.awake();
  }

  addContact(contact: Contact) {
    this._contacts.add(contact);
    this.awake();
  }

  removeContact(contact: Contact) {
    this._contacts.delete(contact);
    this.awake();
  }

  updateTransform() {
    mat3.fromTranslation(this._transform, this._position);
    mat3.rotate(this._transform, this._transform, this._angle);
    affineInverse(this._invTransform, this._transform);
  }

  applyForce(force: vec2, point?: vec2) {
    vec2.add(this._force, this._force, force);

    if (point) {
      const r = vec2.create();
      const x = vec3.create();
      vec2.transformMat3(r, point, this.transform);
      vec2.sub(r, r, this._position);
      this._torque = vec2.cross(x, r, force)[2];
    }

    this.awake();
  }

  clearForces() {
    vec2.set(this._force, 0.0, 0.0);
    this._torque = 0.0;
  }

  toLocalPoint(out: vec2, global: vec2): vec2 {
    return vec2.transformMat3(out, global, this._invTransform);
  }

  toGlobalPoint(out: vec2, local: vec2): vec2 {
    return vec2.transformMat3(out, local, this._transform);
  }

  tick(dt: number): void {
    if (!this.isStatic) {
      if (
        vec2.length(this.velocity) <=
          this.world.settings.sleepingVelocityThreshold &&
        Math.abs(this.omega) <=
          this.world.settings.sleepingAngularVelocityThreshold
      ) {
        this._sleepTimer -= dt;

        if (this._sleepTimer <= 0) {
          this._isSleeping = true;
        }
      } else {
        this.awake();
      }
    }
  }

  awake(): void {
    this._isSleeping = false;
    this._sleepTimer = this.world.settings.fallAsleepTimer;
  }

  advance(dt: number): void {
    if (!this.isStatic) {
      vec2.scaleAndAdd(this._position, this._position, this._velocity, dt);
      this._angle += this._omega * dt;
      this.updateTransform();
    }
  }

  rollback(dt: number): void {
    if (!this.isStatic) {
      vec2.scaleAndAdd(this._position, this._position, this._velocity, -dt);
      this._angle -= this._omega * dt;
      this.updateTransform();
    }
  }
}
