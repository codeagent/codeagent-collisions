import { Service } from 'typedi';

@Service()
export class EventDispatcher {
  private readonly lisneters = new Map<string, Set<CallableFunction>>();

  addEventListener<T extends CallableFunction>(
    eventName: string,
    handler: T
  ): void {
    if (!this.lisneters.has(eventName)) {
      this.lisneters.set(eventName, new Set());
    }

    this.lisneters.get(eventName).add(handler);
  }

  removeEventListener<T extends CallableFunction>(
    eventName: string,
    handler: T
  ): void {
    if (this.lisneters.has(eventName)) {
      this.lisneters.get(eventName).delete(handler);

      if (this.lisneters.get(eventName).size === 0) {
        this.lisneters.delete(eventName);
      }
    }
  }

  dispatch(eventName: string, ...payload: unknown[]): void {
    if (this.lisneters.has(eventName)) {
      for (const handler of this.lisneters.get(eventName)) {
        handler(...payload);
      }
    }
  }

  hasEventListeners(eventName: string): boolean {
    return this.lisneters.has(eventName);
  }

  reset(): void {
    this.lisneters.clear();
  }
}
