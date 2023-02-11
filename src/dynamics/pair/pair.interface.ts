import { SpaceMappingInterface } from '../../math';

export interface PairInterface {
  readonly id: number;
  readonly spaceMapping: SpaceMappingInterface;
  readonly intercontact: boolean;
}
