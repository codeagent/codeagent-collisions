import {
  WorldInterface,
  Events,
  BodyInterface,
  ColliderInterface,
} from 'rb-phys2d';

export interface EventCollectorInterface<T = unknown> extends Iterable<T> {
  readonly listening: boolean;
  listen(world: WorldInterface): void;
  stop(): void;
  reset(): void;
}

export abstract class EventCollector<T> implements EventCollectorInterface<T> {
  protected readonly collection = new Set<T>();

  protected readonly listener = (...args: unknown[]) =>
    this.addToCollection(...args);

  protected world: WorldInterface;

  get listening() {
    return Boolean(this.world);
  }

  constructor(public readonly event: keyof typeof Events) {}

  listen(world: WorldInterface): void {
    if (!this.world) {
      this.world = world;
      world.on(this.event, this.listener);
    }
  }

  stop(): void {
    this.world.off(this.event, this.listener);
    this.world = null;
  }

  reset(): void {
    this.collection.clear();
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.collection;
  }

  protected abstract addToCollection(...args: unknown[]): void;
}

export class BodyEventCollector extends EventCollector<number> {
  protected addToCollection(body: BodyInterface): void {
    this.collection.add(body.id);
  }
}

export class CollisionEventCollector extends EventCollector<[number, number]> {
  protected addToCollection(
    collider0: ColliderInterface,
    collider1: ColliderInterface
  ): void {
    this.collection.add([collider0.body.id, collider1.body.id]);
  }
}
