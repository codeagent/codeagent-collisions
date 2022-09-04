import { vec2 } from 'gl-matrix';

import { JointInterface } from './joint.interface';
import { ContactConstraint, FrictionConstraint } from '../constraint';
import { Body } from '../body';
import { BodyCollider, ContactInfo } from '../../cd';

export class Contact implements JointInterface {
  get bodyA(): Body {
    return this.contactInfo.collider0.body;
  }

  get bodyB(): Body {
    return this.contactInfo.collider1.body;
  }

  get length(): number {
    return this._length;
  }

  get timestamp() {
    return this._timestamp;
  }

  private _length = 1;
  private _timestamp = 0;
  private readonly contactConstraint: ContactConstraint;
  private readonly frictionConstraint: FrictionConstraint;

  constructor(
    public readonly contactInfo: ContactInfo<BodyCollider, BodyCollider>
  ) {
    const world = contactInfo.collider0.body.world;

    this.contactConstraint = new ContactConstraint(
      world,
      contactInfo.collider0.body,
      contactInfo.collider1.body,
      vec2.clone(contactInfo.point1),
      vec2.fromValues(-contactInfo.normal[0], -contactInfo.normal[1]),
      contactInfo.depth
    );

    // @todo: involve materials
    if (world.friction) {
      this.frictionConstraint = new FrictionConstraint(
        world,
        contactInfo.collider0.body,
        contactInfo.collider1.body,
        vec2.clone(contactInfo.point1),
        vec2.fromValues(-contactInfo.normal[0], -contactInfo.normal[1]),
        world.friction
      );

      this._length++;
    }
  }

  *[Symbol.iterator]() {
    yield this.contactConstraint;

    if (this.frictionConstraint) {
      yield this.frictionConstraint;
    }
  }

  updatePenetration(penetration: number): void {
    this.contactConstraint.setPenetration(penetration);
  }

  setTimestamp(timestamp: number): void {
    this._timestamp = timestamp;
  }
}