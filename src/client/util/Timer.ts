import {TimerHandler, AbstractTimer} from '@/core/util';

const MAX_TIME = 4 / 60;

export class Timer extends AbstractTimer {
  private previous: number = 0;
  private handle?: number;
  private trigger: FrameRequestCallback;

  constructor(onTick: TimerHandler) {
    super(onTick);
    this.previous = performance.now();

    this.trigger = async (time: number) => {
      const dt = (time - this.previous) / 1000;
      await this.onTick(Math.min(dt, MAX_TIME));
      this.previous = time;
      this.handle = window.requestAnimationFrame(this.trigger);
    };
  }

  public async start(): Promise<void> {
    this.handle = window.requestAnimationFrame(this.trigger);
  }

  public async stop(): Promise<void> {
    if (this.handle !== undefined) {
      window.cancelAnimationFrame(this.handle);
    }
  }
}
