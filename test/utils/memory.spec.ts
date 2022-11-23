import { World, Memory, createWorld } from 'js-physics-2d';
import Container from 'typedi';

describe('Memory', () => {
  let world: World;
  let memory: Memory;

  beforeEach(() => {
    world = createWorld();
    memory = Container.of(world.settings.uid).get(Memory);
  });

  it('should be non null', () => {
    // assert
    expect(memory).not.toBeFalsy();
  });
});
