import { Timer } from 'server/util';
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

export class TimerManager {
  private timer?: Timer;
  private isRunning: boolean = false;

  public initialize(timer: Timer): void {
    this.timer = timer;
    LM.debug('TimerManager initialized');
  }

  public wake(): void {
    if (!this.isRunning) {
      LM.debug('waking timer');
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
      LM.debug('sleeping timer');
      this.timer?.stop();
      this.isRunning = false;
    }
  }
}
