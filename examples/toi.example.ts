import { mat3, vec2 } from 'gl-matrix';
import {
  World,
  Settings,
  Box,
  Collider,
  Body,
  Capsule,
  Ellipse,
  getToi,
  Clock,
  loadObj,
  Circle,
  MeshShape,
  defaultSettings,
} from 'js-physics-2d';
import { Events } from 'js-physics-2d/events';
import { Inject, Service } from 'typedi';
import { drawBody, drawCapsuleShape } from './services/draw';
import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';
import { BLUISH_COLOR, LINE_COLOR } from './services/draw';

@Service()
export class ToiExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);
  private readonly epsilon = 1.0e-3;
  private readonly maxIterations = 32;
  private readonly velocity = vec2.fromValues(550, -350);
  private readonly omega = Math.PI * 150;

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World,
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
    this.world.dispose();
  }

  private createObjects() {
    const objects = loadObj(GEARS);

    // "continued - moving" objects
    let body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(6, 8),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Box(2, 1), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(6, 4),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(6, -0),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Circle(1), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(6, -4),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

    body = this.world.createBody(1, 1, vec2.fromValues(6, -8), Math.PI * 0.75);
    this.world.addCollider(
      new Collider(body, new MeshShape(objects['gear_o_049']), 0)
    );

    // "descrete" objects
    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-6, 8), 0);
    this.world.addCollider(new Collider(body, new Box(2, 1), 0));

    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-6, 4), 0);
    this.world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-6, -0), 0);
    this.world.addCollider(new Collider(body, new Circle(1), 0));

    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-6, -4), 0);
    this.world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

    body = this.world.createBody(1, 1, vec2.fromValues(-6, -8), 0);
    this.world.addCollider(
      new Collider(body, new MeshShape(objects['gear_o_049']), 0)
    );
  }

  private lerp(transform: mat3, body: Readonly<Body>, dt: number) {
    const position = vec2.clone(body.position);
    const velocity = vec2.clone(body.velocity);

    vec2.scaleAndAdd(position, position, velocity, dt);
    const angle = body.angle + body.omega * dt;

    mat3.fromTranslation(transform, position);
    mat3.rotate(transform, transform, angle);
  }

  private drawSweptVolume(body: Body, dt: number) {
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
    drawCapsuleShape(
      body.collider.shape.radius,
      extend * 0.5,
      transform,
      LINE_COLOR,
      false
    );
  }

  private drawBodiesImpact(body0: Body, body1: Body, dt: number) {
    let currVelocity = vec2.clone(body0.velocity);
    let currOmega = body0.omega;

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
      drawBody(body0, BLUISH_COLOR, transform);
    }

    this.drawSweptVolume(body0, dt);

    body0.velocity = currVelocity;
    body0.omega = currOmega;
  }

  private onPostStep(): void {
    const continued = [
      this.world.bodies[0],
      this.world.bodies[1],
      this.world.bodies[2],
      this.world.bodies[3],
      this.world.bodies[4],
    ];

    const discreet = [
      this.world.bodies[5],
      this.world.bodies[6],
      this.world.bodies[7],
      this.world.bodies[8],
      this.world.bodies[9],
    ];

    for (const c of continued) {
      for (const d of discreet) {
        this.drawBodiesImpact(c, d, this.clock.time - this.clock.lastTime);
      }
    }
  }
}
