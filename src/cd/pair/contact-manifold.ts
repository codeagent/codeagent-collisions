import { vec2 } from 'gl-matrix';

import { Body, Contact } from '../../dynamics';
import { Collider } from '../collider';
import { ContactInfo } from '../types/contact';

export class ContactManifold implements Iterable<Contact> {
  public static readonly MAX_CONTACTS = 2;

  private readonly a = vec2.create();

  private readonly b = vec2.create();

  private readonly ab = vec2.create();

  private readonly da = vec2.create();

  private readonly db = vec2.create();

  private readonly contacts = new Set<Contact>();

  constructor(
    public readonly collider0: Collider,
    public readonly collider1: Collider,
    public readonly threshold: number
  ) {}

  validate(): boolean {
    // validate existing contacts
    for (const contact of this.contacts) {
      vec2.transformMat3(
        this.a,
        contact.contactInfo.localPoint0,
        contact.contactInfo.collider0.transform
      );
      vec2.transformMat3(
        this.b,
        contact.contactInfo.localPoint1,
        contact.contactInfo.collider1.transform
      );
      vec2.sub(this.ab, this.b, this.a);

      // not penetrating
      if (vec2.dot(this.ab, contact.contactInfo.normal) < 0) {
        this.contacts.delete(contact);
        (contact.bodyA as Body).removeContact(contact);
        (contact.bodyB as Body).removeContact(contact);
        continue;
      }

      vec2.sub(this.da, contact.contactInfo.point0, this.a);
      vec2.sub(this.db, contact.contactInfo.point1, this.b);

      if (
        vec2.sqrLen(this.da) >= this.threshold ||
        vec2.sqrLen(this.db) >= this.threshold
      ) {
        this.contacts.delete(contact);
        (contact.bodyA as Body).removeContact(contact);
        (contact.bodyB as Body).removeContact(contact);
        continue;
      }
    }

    return this.contacts.size > 0;
  }

  addContact(contactInfo: ContactInfo): void {
    // check if manifold already includes contact with the same proximity
    for (const contact of this.contacts) {
      vec2.sub(this.da, contactInfo.point0, contact.contactInfo.point0);
      vec2.sub(this.db, contactInfo.point1, contact.contactInfo.point1);

      if (
        vec2.sqrLen(this.da) <= this.threshold &&
        vec2.sqrLen(this.db) <= this.threshold
      ) {
        // if so, update penetration depth and do nothing
        contact.patch(contactInfo);
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
        (newContact.bodyA as Body).removeContact(contact);
        (newContact.bodyB as Body).removeContact(contact);
      }

      this.contacts.add(deepest);
      this.contacts.add(farthest);
    }

    if (this.contacts.has(newContact)) {
      (newContact.bodyA as Body).addContact(newContact);
      (newContact.bodyB as Body).addContact(newContact);
    }
  }

  *[Symbol.iterator]() {
    yield* this.contacts;
  }
}
