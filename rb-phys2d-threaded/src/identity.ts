import { BodyInterface, ColliderInterface } from 'rb-phys2d';

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
