import { Observable, Subject } from 'rxjs';
import { bufferTime, filter, map } from 'rxjs/operators';
import { Service } from 'typedi';

export interface ProfilerStream {
  name: string;
  value: number;
}

@Service()
export class Profiler {
  private static _instance: Profiler;

  private readonly records = new Map<string, number>();

  private readonly broadcast$ = new Subject<ProfilerStream>();

  constructor(readonly bufferTime = 1000) {}

  static get instance(): Profiler {
    if (!this._instance) {
      this._instance = new Profiler();
    }
    return this._instance;
  }

  begin(name: string): void {
    this.records.set(name, performance.now());
  }

  end(name: string): void {
    if (!this.records.has(name)) {
      return;
    }

    this.broadcast$.next({
      name,
      value: performance.now() - this.records.get(name),
    });
  }

  listen(...names: string[]): Observable<Record<string, number>> {
    return this.broadcast$.pipe(
      filter(stream => names.includes(stream.name)),
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
