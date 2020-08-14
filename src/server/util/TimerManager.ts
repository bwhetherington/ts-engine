import { Timer } from 'server/util';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export class TimerManager {
  private timer?: Timer;
  private isRunning: boolean = false;

  public initialize(timer: Timer): void {
    this.timer = timer;
    log.debug('TimerManager initialized');
  }

  public wake(): void {
    if (!this.isRunning) {
      log.debug('waking timer');
      this.timer?.start();
      this.isRunning = true;
    }
  }

  public setInterval(interval: number): void {
    if (this.timer) {
      this.timer.interval = interval;
    }
  }

  public sleep(): void {
    if (this.isRunning) {
      log.debug('sleeping timer');
      this.timer?.stop();
      this.isRunning = false;
    }
  }
}
