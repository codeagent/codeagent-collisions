import { Inject, Service } from 'typedi';

import { Body } from '../body';
import { JointInterface } from '../joint';
import { IslandsGeneratorInterface } from './islands-generator.interface';
import { WorldIsland } from './world-island';
import { Settings } from '../../settings';
import { ConstraintsSolverInterface } from '../solver';
import { Memory } from '../../utils';

@Service()
export class SoleIslandGenerator implements IslandsGeneratorInterface {
  private readonly joints = new Set<JointInterface>();
  private readonly contacts = new Set<JointInterface>();
  private readonly island: WorldIsland;

  constructor(
    @Inject('SETTINGS') settings: Settings,
    @Inject('CONSTRAINTS_SOLVER') solver: ConstraintsSolverInterface,
    memory: Memory
  ) {
    this.island = new WorldIsland(settings, solver, memory);
  }

  *generate(bodies: Iterable<Body>): Iterable<WorldIsland> {
    this.joints.clear();
    this.contacts.clear();
    this.island.clear();

    for (const body of bodies) {
      // skip static bodies
      if (body.isStatic) {
        continue;
      }

      // joints
      for (const joint of body.joints) {
        if (this.joints.has(joint)) {
          continue;
        }

        this.island.addJoint(joint);
        this.joints.add(joint);
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
      }

      this.island.addBody(body);
    }

    if (!this.island.empty) {
      this.island.setId(0);

      yield this.island;
    }
  }
}
