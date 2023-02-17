import { Inject, Service } from 'typedi';

import { Events } from '../../events';
import { Settings } from '../../settings';
import { EventDispatcher, pairId } from '../../utils';
import { Collider } from '../collider';
import { ContactInfo, PairsRegistryInterface } from '../types';

import { Pair } from './pair';

@Service()
export class PairsRegistry implements PairsRegistryInterface {
  private readonly registry = new Map<number, Pair>();

  private readonly active = new Set<Pair>();

  private readonly deleted = new Set<Pair>();

  private readonly persistent = new Set<Pair>();

  private readonly added = new Set<Pair>();

  constructor(
    private readonly dispatcher: EventDispatcher,
    @Inject('SETTINGS') public readonly settings: Readonly<Settings>
  ) {}

  getPairById(id: number): Pair {
    return this.registry.get(id);
  }

  registerPair(collider0: Collider, collider1: Collider): void {
    const pair = new Pair(
      collider0,
      collider1,
      this.settings.contactProximityThreshold
    );
    this.registry.set(pair.id, pair);
  }

  unregisterPair(id: number): void {
    const pair = this.getPairById(id);

    if (pair) {
      this.registry.delete(id);
      this.active.delete(pair);
      this.persistent.delete(pair);
      this.added.delete(pair);
      this.deleted.delete(pair);
    }
  }

  clear(): void {
    this.registry.clear();
    this.active.clear();
    this.deleted.clear();
    this.persistent.clear();
    this.added.clear();
  }

  validatePairs(): void {
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

  addContact(contactInfo: Readonly<ContactInfo>): void {
    const id = pairId(contactInfo.collider0.id, contactInfo.collider1.id);
    const pair = this.registry.get(id);

    pair.addContact(contactInfo);

    if (this.deleted.delete(pair)) {
      this.persistent.add(pair);
    }

    this.active.add(pair);
    this.added.add(pair);
  }

  emitEvents(): void {
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
        pair.contactManifold
      );
      this.added.delete(pair);
    }

    for (const pair of this.added) {
      this.dispatcher.dispatch(
        Events.CollisionStart,
        pair.collider0,
        pair.collider1,
        pair.contactManifold
      );
    }
  }
}
