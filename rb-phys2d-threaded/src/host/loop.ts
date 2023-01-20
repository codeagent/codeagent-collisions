export type LoopHandler = (dt: number) => void;

export class Loop {
  private timer: number;

  private interval: number | 'animationFrame';

  start(handler: LoopHandler, interval: number | 'animationFrame'): void {
    this.interval = interval;

    if (typeof interval === 'string') {
      const step = () => {
        handler(0.01667);
        self.requestAnimationFrame(step);
      };
      this.timer = self.requestAnimationFrame(step);
    } else {
      this.timer = self.setInterval(() => handler(interval), interval * 1000);
    }
  }

  stop(): void {
    if (typeof this.interval === 'string') {
      self.cancelAnimationFrame(this.timer);
    } else {
      self.clearInterval(this.timer);
    }

    this.timer = null;
  }
}
