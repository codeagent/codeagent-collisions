import { mat3, vec2 } from 'gl-matrix';
import {
  World,
  Settings,
  Box,
  Collider,
  Body,
  Capsule,
  Ellipse,
  SpaceMapping,
  distance,
  defaultSettings,
  loadObj,
  Circle,
  MeshShape,
  epa,
  NarrowPhaseInterface,
  ContactCandidate,
} from 'js-physics-2d';
import { Events } from 'js-physics-2d/events';
import { Inject, Service } from 'typedi';
import { drawContact, drawDot } from './services/draw';
import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';
import {
  BLUISH_COLOR,
  drawLineSegment,
  LINE_COLOR,
  REDISH_COLOR,
} from './services/draw';

@Service()
export class ManifoldExample implements ExampleInterface {
  private readonly onPostStepEventListener = this.onPostStep.bind(this);

  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('NARROW_PHASE') private readonly narrowPhase: NarrowPhaseInterface,
    private readonly world: World
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

    let body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(4, 8),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Box(4, 2), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(4, 4),
      Math.PI * 0.5
    );
    this.world.addCollider(new Collider(body, new Capsule(1.0, 3.5), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(4, 0),
      Math.PI * 0.0
    );
    this.world.addCollider(new Collider(body, new Circle(1.5), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(4, -4),
      Math.PI * 0.75
    );
    this.world.addCollider(new Collider(body, new Ellipse(2.0, 1.5), 0));

    body = this.world.createBody(1, 1, vec2.fromValues(4, -8), Math.PI * 0.75);
    this.world.addCollider(
      new Collider(body, new MeshShape(objects['gear_o_049']), 0)
    );

    //
    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-4, 8), 0);
    this.world.addCollider(new Collider(body, new Box(4, 2), 0));

    body = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(4.5, 5.5),
      Math.PI * 0.55
    );
    this.world.addCollider(new Collider(body, new Capsule(1.0, 3.5), 0));

    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-4, -0), 0);
    this.world.addCollider(new Collider(body, new Circle(2.0), 0));

    body = this.world.createBody(1.0, 1.0, vec2.fromValues(-4, -4), 0);
    this.world.addCollider(new Collider(body, new Ellipse(2.0, 1.0), 0));

    body = this.world.createBody(1, 1, vec2.fromValues(-4, -8), 0);
    this.world.addCollider(
      new Collider(body, new MeshShape(objects['gear_o_049']), 0)
    );
  }

  private onPostStep(): void {
    const pairs: ContactCandidate[][] = [];
    for (let i = 0; i < this.world.bodies.length; i++) {
      for (let j = i + 1; j < this.world.bodies.length; j++) {
        const body0 = this.world.bodies[i];
        const body1 = this.world.bodies[j];
        pairs.push([
          new ContactCandidate(body0.collider, body0.collider.shape),
          new ContactCandidate(body1.collider, body1.collider.shape),
        ]);
      }
    }

    Array.from(this.narrowPhase.detectContacts(pairs as any)).forEach((c) =>
      drawContact(c)
    );
  }
}
