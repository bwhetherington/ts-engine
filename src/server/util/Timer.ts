import { TimerHandler, AbstractTimer, sleep } from 'core/util';
import { LM } from 'core/log';

function toSeconds(seconds: number, nanoseconds: number): number {
  return seconds + nanoseconds * 0.000000001;
}

function now(): number {
  const [seconds, nanoseconds] = process.hrtime();
  const time = toSeconds(seconds, nanoseconds);
  return time;
}

const DEFAULT_INTERVAL = 1 / 60;

export class Timer extends AbstractTimer {
  private interval: number;
  private isRunning: boolean;

  constructor(onTick: TimerHandler, interval: number = DEFAULT_INTERVAL) {
    super(onTick);
    this.interval = interval;
    this.isRunning = false;
  }

  private async run(): Promise<void> {
    let start = 0,
      stop = now(),
      dt = 0,
      duration = 0,
      remaining = 0;
    while (this.isRunning) {
      start = now();
      dt = start - stop;
      this.onTick(dt);
      stop = now();
      duration = stop - start;
      remaining = this.interval - duration;
      if (remaining > 0) {
        await sleep(remaining);
      } else {
        const remainingMS = Math.round(remaining * -1000);
        LM.warn(`Can't keep up! Frame took ${remainingMS}ms`);
      }
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    await this.run();
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
  }
}
