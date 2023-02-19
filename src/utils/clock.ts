import { Service } from 'typedi';

@Service()
export class Clock {
  private _time = 0;

  private _lastTime = 0;

  private _frame = 0;

  get time(): number {
    return this._time;
  }

  get lastTime(): number {
    return this._lastTime;
  }

  get frame(): number {
    return this._frame;
  }

  tick(dt: number): void {
    this._lastTime = this._time;
    this._time += dt;
    this._frame++;
  }
}
