import { Service } from 'typedi';

@Service()
export class Clock {
  get time() {
    return this._time;
  }

  get lastTime() {
    return this._lastTime;
  }

  get frame() {
    return this._frame;
  }

  private _time = 0;
  private _lastTime = 0;
  private _frame = 0;

  tick(dt: number) {
    this._lastTime = this._time;
    this._time += dt;
    this._frame++;
  }
}
