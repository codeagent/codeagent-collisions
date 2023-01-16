import { BodyInterface, ColliderInterface } from 'js-physics-2d';

export interface IdentityInterface {
  readonly id: number;
}

export const identity = (
  entity: BodyInterface | ColliderInterface
): IdentityInterface => {
  return Object.defineProperty({} as IdentityInterface, 'id', {
    enumerable: true,
    get: () => entity.id,
  });
};
