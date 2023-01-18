import { Body } from '../body';

import { WorldIsland } from './world-island';

export interface IslandsGeneratorInterface {
  generate(bodies: Iterable<Body>): Iterable<WorldIsland>;
}
