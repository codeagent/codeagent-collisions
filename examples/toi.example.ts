import { mat3, vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Capsule,
  Ellipse,
  getToi,
  Clock,
  loadObj,
  Circle,
  MeshShape,
  defaultSettings,
  BodyInterface,
  Events,
} from 'rb-phys2d';
import { RendererInterface } from 'rb-phys2d-renderer';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';
import { RENDERER_TOKEN } from './services';

@Service()
export class ToiExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);
  private readonly epsilon = 1.0e-3;
  private readonly maxIterations = 32;
  private readonly velocity = vec2.fromValues(550, -350);
  private readonly omega = Math.PI * 150;

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject(RENDERER_TOKEN) private readonly renderer: RendererInterface,
    @Inject('WORLD') private readonly world: WorldInterface,
    private readonly clock: Clock
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
    const objects = loadObj(GEARS);

    // "continued - moving" objects
    let body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(6, 8),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Box(2, 1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(6, 4),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({
      body: body,
      shape: new Capsule(0.5, 1.5),
      mask: 0,
    });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(6, -0),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Circle(1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(6, -4),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({
      body: body,
      shape: new Ellipse(1.0, 0.5),
      mask: 0,
    });

    body = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(6, -8),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({
      body: body,
      shape: new MeshShape(objects['gear_o_049']),
      mask: 0,
    });

    // "descrete" objects
    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-6, 8),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Box(2, 1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-6, 4),
      angle: 0,
    });
    this.world.addCollider({
      body: body,
      shape: new Capsule(0.5, 1.5),
      mask: 0,
    });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-6, -0),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Circle(1), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-6, -4),
      angle: 0,
    });
    this.world.addCollider({
      body: body,
      shape: new Ellipse(1.0, 0.5),
      mask: 0,
    });

    body = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(-6, -8),
      angle: 0,
    });
    this.world.addCollider({
      body: body,
      shape: new MeshShape(objects['gear_o_049']),
      mask: 0,
    });
  }

  private lerp(transform: mat3, body: Readonly<BodyInterface>, dt: number) {
    const position = vec2.clone(body.position);
    const velocity = vec2.clone(body.velocity);

    vec2.scaleAndAdd(position, position, velocity, dt);
    const angle = body.angle + body.omega * dt;

    mat3.fromTranslation(transform, position);
    mat3.rotate(transform, transform, angle);
  }

  private drawSweptVolume(body: BodyInterface, dt: number) {
    const p0 = vec2.create();
    const p1 = vec2.create();

    vec2.copy(p0, body.position);
    vec2.scaleAndAdd(p1, p0, body.velocity, dt);
    const extend = vec2.dist(p0, p1);
    const angle = vec2.angle(vec2.fromValues(0, 1), body.velocity);

    const transform = mat3.create();
    mat3.fromTranslation(transform, p1);
    mat3.rotate(transform, transform, -angle);
    mat3.translate(transform, transform, vec2.fromValues(0, -extend * 0.5));

    // this.renderer.renderC
    // drawCapsuleShape(
    //   body.collider.shape.radius,
    //   extend * 0.5,
    //   transform,
    //   LINE_COLOR,
    //   false
    // );
  }

  private drawBodiesImpact(
    body0: BodyInterface,
    body1: BodyInterface,
    dt: number
  ) {
    const currVelocity = vec2.clone(body0.velocity);
    const currOmega = body0.omega;

    body0.velocity = this.velocity;
    body0.omega = this.omega;

    const toi = getToi(
      body0,
      body0.collider.shape.radius,
      body1,
      body1.collider.shape.radius,
      dt,
      this.epsilon,
      this.maxIterations,
      5.0e-2
    );

    if (toi < 1) {
      const transform = mat3.create();
      this.lerp(transform, body0, dt * toi);
      this.renderer.renderBody(body0);
    }

    this.drawSweptVolume(body0, dt);

    body0.velocity = currVelocity;
    body0.omega = currOmega;
  }

  private onPostStep(): void {
    const worldBodies = Array.from(this.world);

    const continued = [
      worldBodies[0],
      worldBodies[1],
      worldBodies[2],
      worldBodies[3],
      worldBodies[4],
    ];

    const discreet = [
      worldBodies[5],
      worldBodies[6],
      worldBodies[7],
      worldBodies[8],
      worldBodies[9],
    ];

    for (const c of continued) {
      for (const d of discreet) {
        this.drawBodiesImpact(c, d, this.clock.time - this.clock.lastTime);
      }
    }
  }
}
