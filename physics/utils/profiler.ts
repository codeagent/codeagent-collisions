import { Subject } from 'rxjs';
import { bufferTime, filter, map } from 'rxjs/operators';

export interface ProfilerStream {
  name: string;
  value: number;
}

export class Profiler {
  private static _instance: Profiler;
  private readonly records = new Map<string, number>();
  private readonly broadcast$ = new Subject<ProfilerStream>();

  static get instance(): Profiler {
    if (!this._instance) {
      this._instance = new Profiler();
    }
    return this._instance;
  }

  constructor(public bufferTime = 1000) {}

  begin(name: string) {
    this.records.set(name, performance.now());
  }

  end(name: string) {
    if (!this.records.has(name)) {
      return;
    }

    this.broadcast$.next({
      name,
      value: performance.now() - this.records.get(name),
    });
  }

  listen(...names: string[]) {
    return this.broadcast$.pipe(
      filter((stream) => names.includes(stream.name)),
      bufferTime(this.bufferTime),
      map((buffered: ProfilerStream[]) => {
        const counts = buffered.reduce((acc, stream) => {
          acc[stream.name] = acc[stream.name] || 0;
          acc[stream.name] = acc[stream.name] + 1;
          return acc;
        }, {} as Record<string, number>);

        return buffered.reduce((acc, stream) => {
          acc[stream.name] = acc[stream.name] || 0;
          acc[stream.name] =
            acc[stream.name] + stream.value / counts[stream.name];
          return acc;
        }, {} as Record<string, number>);
      })
    );
  }
}
