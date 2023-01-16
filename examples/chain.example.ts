import { vec2 } from 'gl-matrix';
import {
  Settings,
  Box,
  Collider,
  BodyInterface,
  WorldInterface,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class ChainExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.5;
    this.settings.defaultPushFactor = 0.25;
    this.settings.solverIterations = 10;

    this.createChain(20);
  }

  uninstall(): void {
    this.world.clear();
  }

  private createChain(links: number) {
    const chain = new Array<BodyInterface>(links);
    const size = 0.5;
    const distance = 1.0;
    let offset = Math.SQRT2 * size;
    const m = 1.0;
    let x = 0.0;

    for (let i = 0; i < links; i++) {
      const body = this.world.createBody({
        mass: i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m,
        inertia:
          i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m * 0.1,
        position: vec2.fromValues(offset - Math.SQRT2 * size + x - 11, 10),
        angle: -Math.PI * 0.25,
      });
      this.world.addCollider({ body: body, shape: new Box(size, size) });

      if (i > 0) {
        const bodyA = chain[i - 1];
        const pointA = vec2.fromValues(size * 0.5, size * 0.5);
        const pointB = vec2.fromValues(-size * 0.5, -size * 0.5);
        this.world.addDistanceJoint({
          bodyA,
          pivotA: pointA,
          bodyB: body,
          pivotB: pointB,
          distance,
        });
      }

      chain[i] = body;
      offset += Math.SQRT2 * size + distance * 0.5;
    }
  }
}
