import { Service, Inject } from 'typedi';

import { Settings } from '../../settings';
import { Memory } from '../../utils';
import { Body } from '../body';
import { JointInterface } from '../joint';
import { ConstraintsSolverInterface } from '../solver';

import { IslandsGeneratorInterface } from './islands-generator.interface';
import { WorldIsland } from './world-island';

@Service()
export class LocalIslandsGenerator implements IslandsGeneratorInterface {
  private readonly bodies = new Set<Body>();

  private readonly joints = new Set<JointInterface>();

  private readonly contacts = new Set<JointInterface>();

  private readonly stack = new Array<Body>();

  private readonly free = new Set<Body>();

  private readonly island: WorldIsland;

  constructor(
    @Inject('SETTINGS') settings: Settings,
    @Inject('CONSTRAINTS_SOLVER') solver: ConstraintsSolverInterface,
    memory: Memory
  ) {
    this.island = new WorldIsland(settings, solver, memory);
  }

  *generate(bodies: Iterable<Body>): Iterable<WorldIsland> {
    let islandId = 0;
    this.bodies.clear();
    this.joints.clear();
    this.contacts.clear();
    this.free.clear();

    for (const body of bodies) {
      // Skip processed
      if (this.bodies.has(body)) {
        continue;
      }

      if (body.contacts.size === 0 && body.joints.size === 0) {
        this.free.add(body);
        this.bodies.add(body);
        continue;
      }

      this.island.clear();

      // Depth first dependency traverse
      this.stack.length = 0;
      this.stack.push(body);

      while (this.stack.length) {
        const body = this.stack.pop();

        if (this.bodies.has(body)) {
          continue;
        }

        // Skip static bodies
        if (body.isStatic) {
          this.bodies.add(body);
          continue;
        }

        // joints
        for (const joint of body.joints) {
          if (this.joints.has(joint)) {
            continue;
          }

          this.island.addJoint(joint);
          this.joints.add(joint);

          const second = (
            joint.bodyA === body ? joint.bodyB : joint.bodyA
          ) as Body;
          if (second && !this.bodies.has(second)) {
            this.stack.push(second);
          }
        }

        // concacts
        for (const contact of body.contacts) {
          if (this.contacts.has(contact)) {
            continue;
          }

          this.contacts.add(contact);

          // skip virtual collisions
          if (
            contact.contactInfo.collider0.virtual ||
            contact.contactInfo.collider1.virtual
          ) {
            continue;
          }

          this.island.addJoint(contact);

          const second = (
            contact.bodyA === body ? contact.bodyB : contact.bodyA
          ) as Body;
          if (second && !this.bodies.has(second)) {
            this.stack.push(second);
          }
        }

        this.island.addBody(body);
        this.bodies.add(body);
      }

      if (!this.island.empty) {
        this.island.setId(islandId++);

        yield this.island;
      }
    }

    // put all free-moving bodies into one common island
    if (this.free.size !== 0) {
      this.island.clear();
      this.island.setId(islandId++);

      for (const body of this.free) {
        this.island.addBody(body);
      }

      yield this.island;
    }
  }
}
