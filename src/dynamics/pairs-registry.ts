import { vec2 } from 'gl-matrix';
import { Service } from 'typedi';

import { betweenPair, SpaceMapping, SpaceMappingInterface } from '../math';
import { EventDispatcher, pairId } from '../utils';
import { Collider, ContactInfo } from '../cd';
import { Contact } from './joint';
import { Events } from '../events';

const a = vec2.create();
const b = vec2.create();
const ab = vec2.create();
const da = vec2.create();
const db = vec2.create();

export class ContactManifold {
  public static readonly MAX_CONTACTS = 2;

  public readonly contacts = new Set<Contact>();

  constructor(
    public readonly collider0: Collider,
    public readonly collider1: Collider,
    public readonly threshold: number
  ) {}

  validate(): boolean {
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
        contact.bodyA.removeContact(contact);
        contact.bodyB.removeContact(contact);
        continue;
      }

      vec2.sub(da, contact.contactInfo.point0, a);
      vec2.sub(db, contact.contactInfo.point1, b);

      if (
        vec2.sqrLen(da) >= this.threshold ||
        vec2.sqrLen(db) >= this.threshold
      ) {
        this.contacts.delete(contact);
        contact.bodyA.removeContact(contact);
        contact.bodyB.removeContact(contact);
        continue;
      }
    }

    return this.contacts.size > 0;
  }

  addContact(contactInfo: ContactInfo) {
    // check if manifold already includes contact with the same proximity
    for (const contact of this.contacts) {
      vec2.sub(da, contactInfo.point0, contact.contactInfo.point0);
      vec2.sub(db, contactInfo.point1, contact.contactInfo.point1);

      if (
        vec2.sqrLen(da) <= this.threshold &&
        vec2.sqrLen(db) <= this.threshold
      ) {
        // if so, update penetration depth and do nothing
        contact.updatePenetration(contactInfo.depth);
        return;
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

      this.contacts.delete(farthest);

      // remove all that are not either deepest or most distant
      for (const contact of this.contacts) {
        this.contacts.delete(contact);
        newContact.bodyA.removeContact(contact);
        newContact.bodyB.removeContact(contact);
      }

      this.contacts.add(deepest);
      this.contacts.add(farthest);
    }

    if (this.contacts.has(newContact)) {
      newContact.bodyA.addContact(newContact);
      newContact.bodyB.addContact(newContact);
    }
  }
}

export class Pair {
  public readonly id: number;
  public readonly spacesMapping: SpaceMappingInterface;
  public readonly contactManifold: ContactManifold;

  constructor(
    public readonly collider0: Collider,
    public readonly collider1: Collider,
    public readonly proximityThreshold: number
  ) {
    this.id = pairId(this.collider0.id, this.collider1.id);
    this.spacesMapping = betweenPair(
      this.collider0.transform,
      this.collider1.transform
    );
    this.contactManifold = new ContactManifold(
      this.collider0,
      this.collider1,
      this.proximityThreshold
    );
  }

  updateTransforms(): void {
    (this.spacesMapping as SpaceMapping).update(
      this.collider0.transform,
      this.collider1.transform
    );
  }

  validateContacts(): boolean {
    return this.contactManifold.validate();
  }

  addContact(contactInfo: ContactInfo): void {
    this.contactManifold.addContact(contactInfo);
  }
}

@Service()
export class PairsRegistry {
  private readonly registry = new Map<number, Pair>();
  private readonly active = new Set<Pair>();
  private readonly deleted = new Set<Pair>();
  private readonly persistent = new Set<Pair>();
  private readonly added = new Set<Pair>();

  constructor(private readonly dispatcher: EventDispatcher) {}

  getPairById(id: number): Pair {
    return this.registry.get(id);
  }

  registerPair(pair: Pair) {
    this.registry.set(pair.id, pair);
  }

  unregisterPair(id: number) {
    const pair = this.getPairById(id);

    if (pair) {
      this.active.delete(pair);
      this.registry.delete(id);
    }
  }

  clear() {
    this.registry.clear();
    this.active.clear();
    this.deleted.clear();
    this.persistent.clear();
    this.added.clear();
  }

  validatePairs() {
    this.deleted.clear();
    this.persistent.clear();
    this.added.clear();

    for (const pair of this.active) {
      if (!pair.validateContacts()) {
        this.active.delete(pair);
        this.deleted.add(pair);
      } else {
        this.persistent.add(pair);
      }
    }
  }

  addContact(contactInfo: Readonly<ContactInfo>) {
    const id = pairId(contactInfo.collider0.id, contactInfo.collider1.id);
    const pair = this.registry.get(id);

    pair.addContact(contactInfo);

    if (this.deleted.delete(pair)) {
      this.persistent.add(pair);
    }

    this.active.add(pair);
    this.added.add(pair);
  }

  emitEvents() {
    for (const pair of this.deleted) {
      this.dispatcher.dispatch(
        Events.CollisionEnd,
        pair.collider0,
        pair.collider1
      );
    }

    for (const pair of this.persistent) {
      this.dispatcher.dispatch(
        Events.Collide,
        pair.collider0,
        pair.collider1,
        pair.contactManifold.contacts
      );
      this.added.delete(pair);
    }

    for (const pair of this.added) {
      this.dispatcher.dispatch(
        Events.CollisionStart,
        pair.collider0,
        pair.collider1,
        pair.contactManifold.contacts
      );
    }
  }
}
