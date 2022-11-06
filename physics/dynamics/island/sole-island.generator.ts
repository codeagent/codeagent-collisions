import { Body } from '../body';
import { JointInterface } from '../joint';
import { World } from '../world';
import { IslandsGeneratorInterface } from './islands-generator.interface';
import { WorldIsland } from './world-island';

export class SoleIslandGenerator implements IslandsGeneratorInterface {
  private readonly joints = new Set<JointInterface>();
  private readonly contacts = new Set<JointInterface>();

  private readonly island: WorldIsland;

  constructor(private readonly world: World) {
    this.island = new WorldIsland(this.world);
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

        this.island.addJoint(contact);
        this.contacts.add(contact);
      }

      this.island.addBody(body);
    }

    if (!this.island.empty) {
      this.island.setId(0);

      yield this.island;
    }
  }
}
