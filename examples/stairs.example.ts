import { vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Collider,
  Circle,
  ColliderInterface,
  Events,
  BodyInterface,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class StairsExample implements ExampleInterface {
  private readonly listener = (body: BodyInterface) => this.onEvent(body);

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.2;
    this.settings.defaultPushFactor = 0.4;
    this.settings.defaultFriction = 0.2;

    this.createStairs(8);

    this.world.on(Events.Awake, this.listener);
  }

  uninstall(): void {
    this.world.off(Events.Awake, this.listener);
    this.world.clear();
  }

  private createStairs(n: number) {
    Object.assign(this.world.settings, { defaultRestitution: 0.2 });
    Object.assign(this.world.settings, { defaultPushFactor: 0.4 });
    Object.assign(this.world.settings, { defaultFriction: 0.2 });

    const w = 6;
    const h = 2.0;
    const xDist = 5.0;
    const yDist = 0.0;
    const m = 10.0;
    const interval = 1000;

    let k = 3;

    const spawn = () => {
      this.world.addCollider({
        body: this.world.createBody({
          mass: m,
          inertia: m * 0.015,
          position: vec2.fromValues(w * 0.5, 12),
          angle: 0.0,
        }),
        shape: new Circle(0.5),
      });

      if (k--) {
        setTimeout(() => spawn(), interval);
      }
    };

    let y = 10.0 - h;
    while (n--) {
      const x = n % 2 ? xDist * 0.5 : -(xDist * 0.5);

      this.world.addCollider({
        body: this.world.createBody({
          mass: Number.POSITIVE_INFINITY,
          inertia: Number.POSITIVE_INFINITY,
          position: vec2.fromValues(x, y),
          angle: n % 2 ? Math.PI * 0.125 : -Math.PI * 0.125,
        }),
        shape: new Box(w, 0.5),
      });

      y -= h + yDist;
    }

    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, y - 1),
        angle: 0.0,
      }),
      shape: new Box(20, 1),
    });

    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-8, y),
        angle: 0.0,
      }),
      shape: new Box(1, 1),
    });

    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(8, y),
        angle: 0.0,
      }),
      shape: new Box(1, 1),
    });

    spawn();
  }

  private onEvent(body: BodyInterface): void {
    console.log(body);
  }
}
