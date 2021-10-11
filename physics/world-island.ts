import { Body } from './body';
import { ConstraintInterface } from './constraint/constraint.interface';
import { JointInterface } from './joint';

export class WorldIsland {
  public readonly bodies = new Set<Body>();
  public readonly joints = new Set<JointInterface>();
  public readonly contacts = new Set<JointInterface>();
  public readonly motors = new Set<ConstraintInterface>();

  addBody(body: Body) {
    this.bodies.add(body);
  }

  addJoint(joint: JointInterface) {
    this.joints.add(joint);
  }

  addContact(contact: JointInterface) {
    this.contacts.add(contact);
  }

  addMotor(motor: ConstraintInterface) {
    this.motors.add(motor);
  }

  clear() {
    this.bodies.clear();
    this.joints.clear();
    this.contacts.clear();
    this.motors.clear();
  }

  solve(dt: number) {}
}
