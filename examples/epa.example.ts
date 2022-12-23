import { mat3, vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Collider,
  Capsule,
  Ellipse,
  SpaceMapping,
  distance,
  defaultSettings,
  loadObj,
  Circle,
  MeshShape,
  epa,
  BodyInterface,
  Events,
  ColliderInterface,
} from 'js-physics-2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';
import { RendererInterface, RENDERER_TOKEN } from './services';

@Service()
export class EpaExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);
  private readonly initialDir = vec2.create();
  private readonly epsilon = 1.0e-4;
  private readonly relError = 1.0e-6;
  private readonly maxIterations = 25;
  private readonly point0 = vec2.create();
  private readonly point1 = vec2.create();
  private readonly simplex = new Set<vec2>();
  private readonly spacesMapping = new SpaceMapping(
    mat3.create(),
    mat3.create()
  );
  private readonly mtv = vec2.create();

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
    this.world.dispose();
  }

  private createObjects() {
    const objects = loadObj(GEARS);

    let body: BodyInterface = null;

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-2.1968839168548584, 6.876863956451416),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Box(2, 1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 4),
      angle: Math.PI * 0.0,
    });
    this.world.addCollider({ body: body, shape: new Capsule(0.5, 1.5), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 0),
      angle: Math.PI * 0.0,
    });
    this.world.addCollider({ body: body, shape: new Circle(1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, -4),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Ellipse(1.0, 0.5), mask: 0 });

    body = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(4, -8),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider(
      { body: body, shape: new MeshShape(objects['gear_o_049']), mask: 0 }
    );

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, 7.983665943145752),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Box(2, 1), mask: 0x01 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, 4),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Capsule(0.5, 1.5), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, -0),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Circle(1), mask: 0x04 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, -4),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Ellipse(1.0, 0.5), mask: 0 });

    body = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(-4, -8),
      angle: 0,
    });
    this.world.addCollider(
      { body: body, shape: new MeshShape(objects['gear_o_049']), mask: 0 }
    );
  }

  private onPostStep(): void {
    let bodies = Array.from(this.world);

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < length; j++) {
        const collider0 = bodies[i].collider;
        const collider1 = bodies[j].collider;

        if (
          this.getContactPoints(this.point0, this.point1, collider0, collider1)
        ) {
          this.drawContactPoints(this.point0, this.point1);
        }
      }
    }
  }

  private drawContactPoints(point0: vec2, point1: vec2) {
    // drawDot(point0, REDISH_COLOR);
    // drawDot(point1, BLUISH_COLOR);
    // drawLineSegment([point0, point1], LINE_COLOR);
  }

  private getContactPoints(
    point0: vec2,
    point1: vec2,
    collider0: Readonly<ColliderInterface>,
    collider1: Readonly<ColliderInterface>
  ): boolean {
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

    if (dist > 0) {
      vec2.zero(point0);
      vec2.zero(point1);
      return false;
    }

    this.drawSimplex(this.simplex);

    epa(
      this.mtv,
      this.simplex,
      collider0.shape,
      collider1.shape,
      this.spacesMapping,
      0,
      this.epsilon,
      this.maxIterations
    );

    this.spacesMapping.toFirstVector(point0, this.mtv);
    collider0.shape.support(point0, point0);
    this.spacesMapping.fromFirstPoint(point0, point0);

    vec2.negate(this.mtv, this.mtv);

    this.spacesMapping.toSecondVector(point1, this.mtv);
    collider1.shape.support(point1, point1);
    this.spacesMapping.fromSecondPoint(point1, point1);

    return true;
  }

  private drawSimplex(simplex: Set<vec2>) {
    // const points = [...simplex];
    // for (let i = 0; i < points.length; i++) {
    //   const w0 = points[i];
    //   const w1 = points[(i + 1) % points.length];
    //   drawDot(w0, BLUISH_COLOR);
    //   drawLineSegment([w0, w1], LINE_COLOR);
    // }
  }
}
