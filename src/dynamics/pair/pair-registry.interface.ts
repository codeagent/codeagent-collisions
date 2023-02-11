import { Collider, ContactInfo } from '../../cd';

import { PairInterface } from './pair.interface';

export interface PairsRegistryInterface {
  getPairById(id: number): PairInterface;
  registerPair(collider0: Collider, collider1: Collider): void;
  unregisterPair(id: number): void;
  clear(): void;
  validatePairs(): void;
  addContact(contactInfo: Readonly<ContactInfo>): void;
  emitEvents(): void;
  disableIntercontacts(id: number): void;
  enableIntercontacts(id: number): void;
  updateTransform(id: number): void;
}
