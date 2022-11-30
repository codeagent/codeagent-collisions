import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Body } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class ChainExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.5;
    this.settings.defaultPushFactor = 0.25;

    this.createChain(20);
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createChain(links: number) {
    const chain = new Array<Body>(links);
    const size = 0.5;
    const distance = 1.0;
    let offset = Math.SQRT2 * size;
    const m = 1.0;
    let x = 0.0;

    for (let i = 0; i < links; i++) {
      const body = this.world.createBody(
        i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m,
        i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m * 0.1,
        vec2.fromValues(offset - Math.SQRT2 * size + x - 11, 10),
        -Math.PI * 0.25
      );
      this.world.addCollider(new Collider(body, new Box(size, size)));

      if (i > 0) {
        const bodyA = chain[i - 1];
        const pointA = vec2.fromValues(size * 0.5, size * 0.5);
        const pointB = vec2.fromValues(-size * 0.5, -size * 0.5);
        this.world.addDistanceJoint(bodyA, pointA, body, pointB, distance);
      }

      chain[i] = body;
      offset += Math.SQRT2 * size + distance * 0.5;
    }
  }
}
