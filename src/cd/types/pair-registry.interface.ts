import { Collider } from '../collider';
import { Pair } from '../pair';

import { ContactInfo } from './contact';

export interface PairsRegistryInterface {
  getPairById(id: number): Pair;
  registerPair(collider0: Collider, collider1: Collider): void;
  unregisterPair(id: number): void;
  clear(): void;
  validatePairs(): void;
  addContact(contactInfo: Readonly<ContactInfo>): void;
  emitEvents(): void;
}
