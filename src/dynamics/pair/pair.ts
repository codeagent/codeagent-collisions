import { Collider, ContactInfo } from '../../cd';
import { SpaceMapping, SpaceMappingInterface, between } from '../../math';
import { pairId } from '../../utils';

import { ContactManifold } from './contact-manifold';
import { PairInterface } from './pair.interface';

export class Pair implements PairInterface {
  public readonly id: number;

  public readonly contactManifold: ContactManifold;

  get spaceMapping(): SpaceMappingInterface {
    return this._spaceMapping;
  }

  get intercontact(): boolean {
    return this._intercontact;
  }

  private _spaceMapping: SpaceMapping;

  private _intercontact = true;

  constructor(
    public readonly collider0: Collider,
    public readonly collider1: Collider,
    public readonly proximityThreshold: number
  ) {
    this.id = pairId(this.collider0.id, this.collider1.id);
    this._spaceMapping = between(
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
    this._spaceMapping.update(
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

  disableIntercontacts(): void {
    this._intercontact = false;
  }

  enableIntercontacts(): void {
    this._intercontact = true;
  }
}
