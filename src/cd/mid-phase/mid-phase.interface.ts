import { ContactCandidatePair } from '../contact';

export interface MidPhaseInterface {
  detectCandidates(
    candidates: Iterable<ContactCandidatePair>
  ): Iterable<ContactCandidatePair>;
}
