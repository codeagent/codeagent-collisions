import { mat3, mat4, vec2, vec4 } from 'gl-matrix';
import {
  BodyInterface,
  ColliderInterface,
  Contact,
  ContactInfo,
  DistanceJoint,
  JointInterface,
  MotorJoint,
  MouseJoint,
  PrismaticJoint,
  RevoluteJoint,
  SpringJoint,
  WeldJoint,
  WheelJoint,
  WorldInterface,
  pairId,
} from 'rb-phys2d';

import COLORS from './colors';
import { DEFAULT_STYLE_PRESET } from './constants';
import { Device, Geometry } from './device';
import { GeometryFactory } from './geometry-factory';
import {
  StylePresetInterface,
  RendererInterface,
  RenderMask,
} from './renderer.interface';
import {
  vertex as jointVertex,
  fragment as jointFragment,
} from './shaders/joint';
import {
  vertex as shapeVertex,
  fragment as shapeFragment,
} from './shaders/shape';
import { fromHexColor, toMat4 } from './utils';
import { ViewportInterface } from './viewport.interface';

export class WorldRenderer implements RendererInterface {
  private preset: StylePresetInterface = DEFAULT_STYLE_PRESET;

  private readonly colors = COLORS.map(hex => fromHexColor(vec4.create(), hex));

  private readonly origin = vec2.create();

  private readonly axisX = vec2.create();

  private readonly axisY = vec2.create();

  private readonly mat3 = mat3.create();

  private readonly mat4 = mat4.create();

  private readonly identity = mat3.create();

  private device: Device;

  private shapeProgram: WebGLProgram;

  private jointProgram: WebGLProgram;

  private readonly bodyCreatedHandler = this.onBodyCreated.bind(this);

  private readonly bodyDestroyedHandler = this.onBodyDestroyed.bind(this);

  private readonly colliderAddedHandler = this.onColliderAdded.bind(this);

  private readonly colliderRemovedHandler = this.onColliderRemoved.bind(this);

  private readonly jointAddedHandler = this.onJointAdded.bind(this);

  private readonly jointRemovedHandler = this.onJointRemoved.bind(this);

  private readonly collisionStartHandler = this.onCollisionStarted.bind(this);

  private readonly collisionEndHandler = this.onCollisoinEnded.bind(this);

  private readonly bodies = new Map<BodyInterface, Geometry>();

  private readonly joints = new Map<JointInterface, Geometry>();

  private readonly contacts = new Map<number, Set<Contact>>();

  private contactPoint: Geometry;

  private axes: Geometry;

  private pivot: Geometry;

  constructor(
    public readonly viewport: Readonly<ViewportInterface>,
    public readonly world: Readonly<WorldInterface>
  ) {
    this.createDevice();
    this.createShaders();
    this.createGeometry();
    this.subscribeToEvents();
  }

  setStyling(preset: StylePresetInterface): void {
    this.preset = preset;
  }

  clear(): void {
    this.device.clear();
  }

  render(mask: RenderMask = RenderMask.Default): void {
    if (mask) {
      this.setProjection();
    }

    if (mask & RenderMask.Axes) {
      this.device.useProgram(this.jointProgram);
      this.renderGrid();
    }

    if (mask & RenderMask.Body) {
      this.device.useProgram(this.shapeProgram);

      for (const [body, geometry] of this.bodies) {
        this.renderBody(body, geometry);
      }
    }

    if (mask & RenderMask.Joint) {
      this.device.useProgram(this.jointProgram);

      for (const [joints, geometry] of this.joints) {
        this.renderJoint(joints, geometry, mask);
      }
    }

    if (mask & RenderMask.Contact) {
      this.device.useProgram(this.jointProgram);

      for (const manifold of this.contacts.values()) {
        for (const contact of manifold) {
          this.renderContactPoint(contact.contactInfo);
        }
      }
    }
  }

  destroy(): void {
    this.unsubscribeFromEvents();
    this.destroyShaders();
    this.destroyGeometry();
    this.destroyBodies();
    this.destroyJoints();
    this.destroyContacts();
  }

  reset(): void {
    this.destroyBodies();
    this.destroyJoints();
    this.destroyContacts();
  }

  private subscribeToEvents(): void {
    this.world.on('BodyCreated', this.bodyCreatedHandler);
    this.world.on('BodyDestroyed', this.bodyDestroyedHandler);
    this.world.on('ColliderAdded', this.colliderAddedHandler);
    this.world.on('ColliderRemoved', this.colliderRemovedHandler);
    this.world.on('JointAdded', this.jointAddedHandler);
    this.world.on('JointRemoved', this.jointRemovedHandler);
    this.world.on('CollisionStart', this.collisionStartHandler);
    this.world.on('CollisionEnd', this.collisionEndHandler);
  }

  private unsubscribeFromEvents(): void {
    this.world.off('BodyCreated', this.bodyCreatedHandler);
    this.world.off('BodyDestroyed', this.bodyDestroyedHandler);
    this.world.off('ColliderAdded', this.colliderAddedHandler);
    this.world.off('ColliderRemoved', this.colliderRemovedHandler);
    this.world.off('JointAdded', this.jointAddedHandler);
    this.world.off('JointRemoved', this.jointRemovedHandler);
    this.world.off('CollisionStart', this.collisionStartHandler);
    this.world.off('CollisionEnd', this.collisionEndHandler);
  }

  private onBodyCreated(body: BodyInterface): void {
    this.registerBodyGeometry(body);
  }

  private onBodyDestroyed(body: BodyInterface): void {
    this.unregisterBodyGeometry(body);
  }

  private onColliderAdded(
    collider: ColliderInterface,
    body: BodyInterface
  ): void {
    this.unregisterBodyGeometry(body);
    this.registerBodyGeometry(body);
  }

  private onColliderRemoved(
    collider: ColliderInterface,
    body: BodyInterface
  ): void {
    this.unregisterBodyGeometry(body);
  }

  private onJointAdded(joint: JointInterface): void {
    this.registerJointGeometry(joint);
  }

  private onJointRemoved(joint: JointInterface): void {
    this.unregisterJointGeometry(joint);
  }

  private onCollisionStarted(
    collider0: ColliderInterface,
    collider1: ColliderInterface,
    contacts: Set<Contact>
  ): void {
    if (contacts) {
      this.contacts.set(pairId(collider0.id, collider1.id), contacts);
    }
  }

  private onCollisoinEnded(
    collider0: ColliderInterface,
    collider1: ColliderInterface
  ): void {
    this.contacts.delete(pairId(collider0.id, collider1.id));
  }

  private createDevice(): void {
    this.device = new Device(this.viewport.context);
    this.device.clearColor(this.preset.backgroundColor);
  }

  private createShaders(): void {
    this.shapeProgram = this.device.createShader(shapeVertex, shapeFragment);
    this.jointProgram = this.device.createShader(jointVertex, jointFragment);
  }

  private destroyShaders(): void {
    this.device.destroyProgram(this.shapeProgram);
    this.device.destroyProgram(this.jointProgram);
  }

  private destroyGeometry(): void {
    this.device.destroyGeometry(this.axes);
    this.device.destroyGeometry(this.contactPoint);
    this.device.destroyGeometry(this.pivot);
  }

  private destroyBodies(): void {
    for (const geometry of this.bodies.values()) {
      this.device.destroyGeometry(geometry);
    }

    this.bodies.clear();
  }

  private destroyJoints(): void {
    for (const geometry of this.joints.values()) {
      this.device.destroyGeometry(geometry);
    }

    this.joints.clear();
  }

  private destroyContacts(): void {
    this.contacts.clear();
  }

  private createGeometry(): void {
    this.axes = this.device.createGeometry(
      GeometryFactory.createGrid(256, 1.0, this.preset)
    );

    this.contactPoint = this.device.createGeometry(
      GeometryFactory.createContactPoint(this.preset)
    );

    this.pivot = this.device.createGeometry(
      GeometryFactory.createPivot(this.preset)
    );

    const visited = new Set<JointInterface>();
    for (const body of this.world) {
      this.registerBodyGeometry(body);

      for (const joint of body.joints) {
        if (!visited.has(joint)) {
          this.registerJointGeometry(joint);
          visited.add(joint);
        }
      }
    }
  }

  private registerBodyGeometry(body: BodyInterface): void {
    const geometry = body.collider
      ? this.device.createGeometry(
          GeometryFactory.createShape(body.collider.shape)
        )
      : this.device.createGeometry(GeometryFactory.createCross());
    this.bodies.set(body, geometry);
  }

  private unregisterBodyGeometry(body: BodyInterface): void {
    if (this.bodies.has(body)) {
      this.device.destroyGeometry(this.bodies.get(body));
      this.bodies.delete(body);
    }
  }

  private registerJointGeometry(joint: JointInterface): void {
    try {
      const geometry = this.device.createGeometry(
        GeometryFactory.createJoint(joint, this.preset)
      );
      this.joints.set(joint, geometry);
    } catch (e) {
      console.warn(`Failed to create ${joint.constructor.name}`);
    }
  }

  private unregisterJointGeometry(joint: JointInterface): void {
    if (this.joints.has(joint)) {
      this.device.destroyGeometry(this.joints.get(joint));
      this.joints.delete(joint);
    }
  }

  private setColor(color: vec4, program: WebGLProgram): void {
    this.device.setProgramVariable(program, 'albedo', 'vec4', color);
  }

  private setTransform(transform: Readonly<mat3>, program: WebGLProgram): void {
    this.device.setProgramVariable(
      program,
      'worldMat',
      'mat4',
      toMat4(this.mat4, transform)
    );
  }

  private renderGrid(): void {
    this.setTransform(this.identity, this.jointProgram);
    this.device.drawGeometry(this.axes);
  }

  private renderBody(body: BodyInterface, geometry: Geometry): void {
    const color = body.isStatic
      ? this.preset.staticBodyColor
      : body.isSleeping
      ? this.preset.sleepingBodyColor
      : this.colors[Math.max(body.islandId, 0) % this.colors.length];

    this.setColor(color, this.shapeProgram);
    this.setTransform(body.transform, this.shapeProgram);
    this.device.drawGeometry(geometry);
  }

  private renderJoint(
    joint: JointInterface,
    geometry: Geometry,
    mask: RenderMask
  ): void {
    if (joint instanceof RevoluteJoint && mask & RenderMask.RevoluteJoint) {
      this.renderRevoluteJoint(joint, geometry);
    } else if (joint instanceof WeldJoint && mask & RenderMask.WeldJoint) {
      this.renderWeldJoint(joint, geometry);
    } else if (joint instanceof MouseJoint && mask & RenderMask.MouseJoint) {
      this.renderMouseJoint(joint, geometry);
    } else if (joint instanceof MotorJoint && mask & RenderMask.MotorJoint) {
      this.renderMotorJoint(joint, geometry);
    } else if (joint instanceof SpringJoint && mask & RenderMask.Spring) {
      this.renderSpring(joint, geometry);
    } else if (
      joint instanceof DistanceJoint &&
      mask & RenderMask.DistanceJoint
    ) {
      this.renderDistanceJoint(joint, geometry);
    } else if (
      joint instanceof PrismaticJoint &&
      mask & RenderMask.RevoluteJoint
    ) {
      this.renderPrismaticJoint(joint, geometry);
    } else if (joint instanceof WheelJoint && mask & RenderMask.WheelJoint) {
      this.renderWheelJoint(joint, geometry);
    }
  }

  private renderRevoluteJoint(joint: RevoluteJoint, geometry: Geometry): void {
    joint.bodyA.toGlobalPoint(this.origin, joint.pivotA);
    mat3.fromTranslation(this.mat3, this.origin);

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);
    this.device.drawGeometry(this.pivot);
  }

  private renderWeldJoint(joint: WeldJoint, geometry: Geometry): void {
    joint.bodyA.toGlobalPoint(this.origin, joint.pivotA);
    mat3.fromTranslation(this.mat3, this.origin);

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);
  }

  private renderMouseJoint(joint: MouseJoint, geometry: Geometry): void {
    joint.control.getCursorPosition(this.origin);
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);

    joint.bodyA.toGlobalPoint(this.origin, joint.joint);
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);

    joint.control.getCursorPosition(this.axisY);
    vec2.sub(this.axisY, this.axisY, this.origin);
    vec2.set(this.axisX, -this.axisY[1], this.axisY[0]);
    vec2.normalize(this.axisX, this.axisX);

    mat3.set(
      this.mat3,
      this.axisX[0],
      this.axisX[1],
      0,
      this.axisY[0],
      this.axisY[1],
      0,
      this.origin[0],
      this.origin[1],
      1.0
    );

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);
  }

  private renderMotorJoint(joint: MotorJoint, geometry: Geometry): void {
    mat3.fromTranslation(this.mat3, joint.bodyA.position);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);
  }

  private renderSpring(joint: SpringJoint, geometry: Geometry): void {
    joint.bodyA.toGlobalPoint(this.origin, joint.pivotA);
    joint.bodyB.toGlobalPoint(this.axisY, joint.pivotB);

    vec2.sub(this.axisY, this.axisY, this.origin);
    vec2.set(this.axisX, -this.axisY[1], this.axisY[0]);
    vec2.normalize(this.axisX, this.axisX);

    mat3.set(
      this.mat3,
      this.axisX[0],
      this.axisX[1],
      0,
      this.axisY[0],
      this.axisY[1],
      0,
      this.origin[0],
      this.origin[1],
      1.0
    );

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);

    // pivot A
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);

    // pivot B
    joint.bodyB.toGlobalPoint(this.origin, joint.pivotB);
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);
  }

  private renderDistanceJoint(joint: DistanceJoint, geometry: Geometry): void {
    joint.bodyA.toGlobalPoint(this.origin, joint.pivotA);
    joint.bodyB.toGlobalPoint(this.axisY, joint.pivotB);

    vec2.sub(this.axisY, this.axisY, this.origin);
    vec2.normalize(this.axisY, this.axisY);
    vec2.set(this.axisX, -this.axisY[1], this.axisY[0]);

    mat3.set(
      this.mat3,
      this.axisX[0],
      this.axisX[1],
      0,
      this.axisY[0],
      this.axisY[1],
      0,
      this.origin[0],
      this.origin[1],
      1.0
    );

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(geometry);

    // pivot A
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);

    // pivot B
    joint.bodyB.toGlobalPoint(this.origin, joint.pivotB);
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);
  }

  private renderPrismaticJoint(
    joint: PrismaticJoint,
    geometry: Geometry
  ): void {
    this.setTransform(joint.bodyA.transform, this.jointProgram);
    this.device.drawGeometry(geometry);

    // pivot B
    joint.bodyB.toGlobalPoint(this.origin, joint.pivotB);
    mat3.fromTranslation(this.mat3, this.origin);
    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.pivot);
  }

  private renderWheelJoint(joint: WheelJoint, geometry: Geometry): void {
    this.setTransform(joint.bodyA.transform, this.jointProgram);
    this.device.drawGeometry(geometry);
  }

  private renderContactPoint(contact: ContactInfo): void {
    vec2.copy(this.axisY, contact.normal);
    vec2.set(this.axisX, -this.axisY[1], this.axisY[0]);
    vec2.copy(this.origin, contact.point0);

    mat3.set(
      this.mat3,
      this.axisX[0],
      this.axisX[1],
      0,
      this.axisY[0],
      this.axisY[1],
      0,
      this.origin[0],
      this.origin[1],
      1.0
    );

    this.setTransform(this.mat3, this.jointProgram);
    this.device.drawGeometry(this.contactPoint);
  }

  private setProjection(): void {
    this.device.useProgram(this.shapeProgram);
    this.device.setProgramVariable(
      this.shapeProgram,
      'projMat',
      'mat4',
      toMat4(this.mat4, this.viewport.projection)
    );

    this.device.useProgram(this.jointProgram);
    this.device.setProgramVariable(
      this.jointProgram,
      'projMat',
      'mat4',
      toMat4(this.mat4, this.viewport.projection)
    );
  }
}
