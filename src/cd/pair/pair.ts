import { Collider, ContactInfo } from '..';
import { SpaceMapping, SpaceMappingInterface, between } from '../../math';
import { pairId } from '../../utils';

import { ContactManifold } from './contact-manifold';

export class Pair {
  public readonly id: number;

  public readonly contactManifold: ContactManifold;

  public readonly spaceMapping: SpaceMappingInterface;

  public intercontact = true;

  constructor(
    public readonly collider0: Collider,
    public readonly collider1: Collider,
    public readonly proximityThreshold: number
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
