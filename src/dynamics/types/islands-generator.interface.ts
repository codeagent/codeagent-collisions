import { Body } from '../body';
import { WorldIsland } from '../island';

export interface IslandsGeneratorInterface {
  generate(bodies: Iterable<Body>): Iterable<WorldIsland>;
}
