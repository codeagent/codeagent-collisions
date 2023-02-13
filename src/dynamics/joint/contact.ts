import { vec2 } from 'gl-matrix';

import { ContactInfo } from '../../cd';
import { BodyInterface } from '../body.interface';
import { ContactConstraint, FrictionConstraint } from '../constraint';

import { JointInterface } from './joint.interface';

export class Contact implements JointInterface {
  get bodyA(): BodyInterface {
    return this.contactInfo.collider0.body;
  }

  get bodyB(): BodyInterface {
    return this.contactInfo.collider1.body;
  }

  private readonly contactConstraint: ContactConstraint;

  private readonly frictionConstraint: FrictionConstraint;

  constructor(public readonly contactInfo: ContactInfo) {
    const world = contactInfo.collider0.body.world;

    this.contactConstraint = new ContactConstraint(
      world,
      contactInfo.collider0.body,
      contactInfo.collider1.body,
      vec2.clone(contactInfo.point0),
      vec2.fromValues(-contactInfo.normal[0], -contactInfo.normal[1]),
      contactInfo.depth
    );

    const friction =
      (contactInfo.collider0.material.friction +
        contactInfo.collider1.material.friction) *
      0.5;

    if (friction > 0) {
      this.frictionConstraint = new FrictionConstraint(
        world,
        contactInfo.collider0.body,
        contactInfo.collider1.body,
        vec2.clone(contactInfo.point0),
        vec2.fromValues(-contactInfo.normal[0], -contactInfo.normal[1]),
        friction
      );
    }
  }

  *[Symbol.iterator]() {
    yield this.contactConstraint;

    if (this.frictionConstraint) {
      yield this.frictionConstraint;
    }
  }

  patchPenetration(penetration: number): void {
    this.contactConstraint.setPenetration(penetration);
  }

  patch(contact: ContactInfo): void {
    this.contactConstraint.patch(contact.point0, contact.depth);

    if (this.frictionConstraint) {
      this.frictionConstraint.patch(
        contact.point0,
        vec2.fromValues(-contact.normal[0], -contact.normal[1])
      );
    }
  }
}
