import { mat3, vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Collider,
  Capsule,
  Ellipse,
  defaultSettings,
  loadObj,
  Circle,
  MeshShape,
  NarrowPhaseInterface,
  ContactCandidate,
} from 'js-physics-2d';
import { Events } from 'js-physics-2d/events';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';
import { RendererInterface, RENDERER_TOKEN } from './services';

@Service()
export class ManifoldExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('NARROW_PHASE') private readonly narrowPhase: NarrowPhaseInterface,
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

    let body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 8),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Box(4, 2), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 4),
      angle: Math.PI * 0.5,
    });
    this.world.addCollider({ body: body, shape: new Capsule(1.0, 3.5), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, 0),
      angle: Math.PI * 0.0,
    });
    this.world.addCollider({ body: body, shape: new Circle(1.5), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4, -4),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider({ body: body, shape: new Ellipse(2.0, 1.5), mask: 0 });

    body = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(4, -8),
      angle: Math.PI * 0.75,
    });
    this.world.addCollider(
      { body: body, shape: new MeshShape(objects['gear_o_049']), mask: 0 }
    );

    //
    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, 8),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Box(4, 2), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(4.5, 5.5),
      angle: Math.PI * 0.55,
    });
    this.world.addCollider({ body: body, shape: new Capsule(1.0, 3.5), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, -0),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Circle(2.0), mask: 0 });

    body = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-4, -4),
      angle: 0,
    });
    this.world.addCollider({ body: body, shape: new Ellipse(2.0, 1.0), mask: 0 });

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
    const pairs: ContactCandidate[][] = [];
    const bodies = Array.from(this.world);

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const body0 = bodies[i];
        const body1 = bodies[j];
        pairs.push([
          new ContactCandidate(body0.collider as Collider, body0.collider.shape),
          new ContactCandidate(body1.collider as Collider, body1.collider.shape),
        ]);
      }
    }

    // Array.from(this.narrowPhase.detectContacts(pairs as any)).forEach((c) =>
    //   this.renderer.renderJoint(c)
    // );
  }
}
