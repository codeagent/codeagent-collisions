import { mat3, vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Polygon,
  Capsule,
  Ellipse,
  SpaceMapping,
  mdv,
  distance,
  defaultSettings,
  ColliderInterface,
} from 'rb-phys2d';
import { Events } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import { RendererInterface, RENDERER_TOKEN } from './services';

@Service()
export class GjkExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);
  private readonly initialDir = vec2.create();
  private readonly relError = 1.0e-6;
  private readonly maxIterations = 64;
  private readonly point0 = vec2.create();
  private readonly point1 = vec2.create();
  private readonly simplex = new Set<vec2>();
  private readonly spacesMapping = new SpaceMapping(
    mat3.create(),
    mat3.create()
  );
  private readonly sv = vec2.create();

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject(RENDERER_TOKEN) private readonly renderer: RendererInterface,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultDamping = 2.0;
    this.settings.defaultAngularDamping = 2.0;
    this.settings.gravity = vec2.fromValues(0.0, 0.0);

    this.createObjects();
    this.world.on(Events.PostStep, this.onPostStepEventListener);
  }

  uninstall(): void {
    this.world.off(Events.PostStep, this.onPostStepEventListener);
    Object.assign(this.settings, defaultSettings);
    this.world.clear();
  }

  private createObjects() {
    const createTriangleShape = (r: number = 1): Polygon => {
      return new Polygon([
        vec2.fromValues(-0.5 * r, -0.5 * r),
        vec2.fromValues(0.5 * r, -0.5 * r),
        vec2.fromValues(0.0, 0.5 * r),
      ]);
    };

    // Scene
    let body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, -6),
      angle: 0.0,
    });
    this.world.addCollider({ body: body, shape: new Box(1, 1), mask: 0x01 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, -6),
      angle: 0.0,
    });
    this.world.addCollider({
      body: body,
      shape: createTriangleShape(3),
      mask: 0x02,
    });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 6),
      angle: 0.0,
    });
    this.world.addCollider({
      body: body,
      shape: new Capsule(1, 4),
      mask: 0x04,
    });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, 6),
      angle: 0.0,
    });
    this.world.addCollider({
      body: body,
      shape: new Ellipse(3, 2),
      mask: 0x08,
    });
  }

  private onPostStep(): void {
    const worldBodies = Array.from(this.world);

    const bodies = [
      worldBodies[0],
      worldBodies[1],
      worldBodies[2],
      worldBodies[3],
    ];

    for (let i = 0; i < bodies.length; i++) {
      const body0 = bodies[i];
      const body1 = bodies[(i + 1) % bodies.length];

      let dist = this.getClosestPoints(
        this.point0,
        this.point1,
        body0.collider,
        body1.collider
      );

      if (dist !== 0) {
        this.drawClosestPoints(this.point0, this.point1);
        vec2.add(this.point0, this.point0, this.point1);
        vec2.scale(this.point0, this.point0, 0.5);
        // drawText(`${dist.toFixed(2)}`, this.point0);
      }
    }
  }

  private drawClosestPoints(point0: vec2, point1: vec2) {
    // drawDot(point0, REDISH_COLOR);
    // drawDot(point1, BLUISH_COLOR);
    // drawLineSegment([point0, point1], LINE_COLOR);
  }

  private getClosestPoints(
    point0: vec2,
    point1: vec2,
    collider0: Readonly<ColliderInterface>,
    collider1: Readonly<ColliderInterface>
  ): number {
    this.spacesMapping.update(collider0.transform, collider1.transform);
    this.simplex.clear();
    vec2.sub(this.initialDir, collider0.body.position, collider1.body.position);

    const dist = distance(
      this.simplex,
      collider0.shape,
      collider1.shape,
      this.spacesMapping,
      this.initialDir,
      0,
      this.relError,
      this.maxIterations
    );

    if (dist === 0) {
      return 0;
    }

    mdv(this.sv, this.simplex);

    this.spacesMapping.toSecondVector(point1, this.sv);
    collider1.shape.support(point1, point1);
    this.spacesMapping.fromSecondPoint(point1, point1);

    vec2.negate(this.sv, this.sv);

    this.spacesMapping.toFirstVector(point0, this.sv);
    collider0.shape.support(point0, point0);
    this.spacesMapping.fromFirstPoint(point0, point0);

    return dist;
  }
}
