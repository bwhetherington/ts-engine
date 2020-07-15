import { TimerHandler, AbstractTimer } from 'core/util';
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

const MAX_TIME = 4 / 60;

export class Timer extends AbstractTimer {
  private previous: number = 0;
  private handle?: number;
  private trigger: FrameRequestCallback;

  constructor(onTick: TimerHandler) {
    super(onTick);
    this.previous = performance.now();

    this.trigger = (time) => {
      let dt = (time - this.previous) / 1000;
      // if (dt - this.target > MIN_TOLERANCE) {
      //   LM.warn("can't keep up");
      // }
      // while (dt > MIN_TOLERANCE) {
      this.onTick(Math.min(dt, MAX_TIME));
      //   dt -= target;
      // }
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
