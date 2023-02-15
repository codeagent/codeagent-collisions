import { ContactCandidatePair, ContactInfo } from './contact';

export interface NarrowPhaseInterface {
  detectContacts(pairs: Iterable<ContactCandidatePair>): Iterable<ContactInfo>;
}
