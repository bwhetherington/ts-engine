import { TimerHandler, AbstractTimer } from "../../shared/util/util";

class Timer extends AbstractTimer {
  private previous: number = 0;
  private handle?: number;
  private trigger: FrameRequestCallback;

  constructor(onTick: TimerHandler) {
    super(onTick);
    this.previous = performance.now();
    this.trigger = (time) => {
      const dt = time - this.previous;
      this.previous = time;
      this.onTick(dt / 1000);
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

export default Timer;
