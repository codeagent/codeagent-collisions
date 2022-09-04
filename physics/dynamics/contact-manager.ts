import { vec2 } from 'gl-matrix';
import { BodyCollider, ContactInfo } from '../cd';
import { Clock, pairId } from '../utils';
import { Contact } from './joint';

export class ContactManager {
  private readonly registry = new Map<number, ContactManifold>();
  private readonly colliders = new Set<BodyCollider>();
  private readonly clock = Clock.instance;

  constructor(public readonly threshold = 5e-3) {}

  registerCollider(collider: BodyCollider) {
    this.colliders.add(collider);
  }

  unregisterCollider(collider: BodyCollider) {
    this.colliders.delete(collider);

    for (const [key, manifold] of this.registry) {
      if (manifold.collider0 === collider || manifold.collider1 === collider) {
        this.registry.delete(key);
      }
    }
  }

  validate() {
    const timestamp = this.clock.frame;
    for (const collider of this.colliders) {
      for (const contact of collider.body.contacts) {
        if (contact.timestamp !== timestamp) {
          collider.body.removeContact(contact);
        }
      }
    }
  }

  addContact(contactInfo: ContactInfo<BodyCollider, BodyCollider>) {
    const id = pairId(contactInfo.collider0.id, contactInfo.collider1.id);

    let manifold = this.registry.get(id);
    if (!manifold) {
      manifold = new ContactManifold(
        contactInfo.collider0,
        contactInfo.collider1,
        this.threshold
      );
      this.registry.set(id, manifold);
    }

    const contact = manifold.addContact(contactInfo);

    if (contact) {
      contact.setTimestamp(this.clock.frame);
      contactInfo.collider0.body.addContact(contact);
      contactInfo.collider1.body.addContact(contact);
    }
  }

  *getContactManifold(
    collider0: BodyCollider,
    collider1: BodyCollider
  ): Iterable<Contact> {
    yield* this.registry.get(pairId(collider0.id, collider1.id));
  }
}

const a = vec2.create();
const b = vec2.create();
const ab = vec2.create();
const da = vec2.create();
const db = vec2.create();

export class ContactManifold implements Iterable<Contact> {
  public static readonly MAX_CONTACTS = 2;
  private readonly contacts = new Set<Contact>();

  constructor(
    public readonly collider0: BodyCollider,
    public readonly collider1: BodyCollider,
    public readonly threshold: number
  ) {}

  addContact(contactInfo: ContactInfo<BodyCollider, BodyCollider>): Contact {
    // validate existing contacts
    for (const contact of this.contacts) {
      vec2.transformMat3(
        a,
        contact.contactInfo.localPoint0,
        contact.contactInfo.collider0.transform
      );
      vec2.transformMat3(
        b,
        contact.contactInfo.localPoint1,
        contact.contactInfo.collider1.transform
      );
      vec2.sub(ab, b, a);

      // not penetrating
      if (vec2.dot(ab, contact.contactInfo.normal) < 0) {
        this.contacts.delete(contact);
        continue;
      }

      vec2.sub(da, contact.contactInfo.point0, a);
      vec2.sub(db, contact.contactInfo.point1, b);

      if (
        vec2.sqrLen(da) >= this.threshold ||
        vec2.sqrLen(db) >= this.threshold
      ) {
        this.contacts.delete(contact);
        continue;
      }
    }

    // check if manifold already includes contact with the same proximity
    for (const contact of this.contacts) {
      vec2.sub(da, contactInfo.point0, contact.contactInfo.point0);
      vec2.sub(db, contactInfo.point1, contact.contactInfo.point1);

      if (
        vec2.sqrLen(da) <= this.threshold &&
        vec2.sqrLen(db) <= this.threshold
      ) {
        // if so, update penetration depth
        contact.updatePenetration(contactInfo.depth);
        return contact;
      }
    }

    // add to manifold
    const newContact = new Contact(contactInfo);
    this.contacts.add(newContact);

    // count down number of contacts to 2
    if (this.contacts.size > ContactManifold.MAX_CONTACTS) {
      let deepest: Contact = null;
      let maxDepth = Number.NEGATIVE_INFINITY;

      // deepest
      for (const contact of this.contacts) {
        if (contact.contactInfo.depth > maxDepth) {
          deepest = contact;
          maxDepth = contact.contactInfo.depth;
        }
      }

      this.contacts.delete(deepest);

      // most distant
      let farthest: Contact = null;
      let maxDistance = Number.NEGATIVE_INFINITY;
      for (const contact of this.contacts) {
        const distance = vec2.squaredDistance(
          contact.contactInfo.point0,
          deepest.contactInfo.point0
        );

        if (distance > maxDistance) {
          maxDistance = distance;
          farthest = contact;
        }
      }

      this.contacts.clear();
      this.contacts.add(deepest);
      this.contacts.add(farthest);
    }

    if (this.contacts.has(newContact)) {
      return newContact;
    } else {
      return null;
    }
  }

  *[Symbol.iterator]() {
    for (const contact of this.contacts) {
      yield contact;
    }
  }
}
