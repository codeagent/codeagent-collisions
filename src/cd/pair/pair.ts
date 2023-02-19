import { SpaceMapping, SpaceMappingInterface, between } from '../../math';
import { pairId } from '../../utils';
import { Collider } from '../collider';
import { ContactInfo } from '../types';

import { ContactManifold } from './contact-manifold';

export class Pair {
  readonly id: number;

  readonly contactManifold: ContactManifold;

  readonly spaceMapping: SpaceMappingInterface;

  intercontact = true;

  constructor(
    readonly collider0: Collider,
    readonly collider1: Collider,
    readonly proximityThreshold: number
  ) {
    this.id = pairId(this.collider0.id, this.collider1.id);
    this.spaceMapping = between(
      this.collider0.transform,
      this.collider1.transform
    );
    this.contactManifold = new ContactManifold(
      this.collider0,
      this.collider1,
      this.proximityThreshold
    );
  }

  updateTransform(): void {
    (this.spaceMapping as SpaceMapping).update(
      this.collider0.transform,
      this.collider1.transform
    );
  }

  validateContacts(): boolean {
    return this.contactManifold.validate();
  }

  addContact(contactInfo: ContactInfo): void {
    this.contactManifold.addContact(contactInfo);
  }
}
