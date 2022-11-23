import { Service } from 'typedi';

@Service()
export class EventDispatcher {
  private readonly lisneters = new Map<string, Set<Function>>();

  addEventListener<T extends Function>(eventName: string, handler: T) {
    if (!this.lisneters.has(eventName)) {
      this.lisneters.set(eventName, new Set());
    }

    this.lisneters.get(eventName).add(handler);
  }

  removeEventListener<T extends Function>(eventName: string, handler: T) {
    if (this.lisneters.has(eventName)) {
      this.lisneters.get(eventName).delete(handler);
    }
  }

  dispatch(eventName: string, ...payload: unknown[]) {
    if (this.lisneters.has(eventName)) {
      for (const handler of this.lisneters.get(eventName)) {
        handler(...payload);
      }
    }
  }

  reset() {
    this.lisneters.clear();
  }
}