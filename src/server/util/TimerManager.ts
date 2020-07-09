import { Timer } from 'server/util';
import { LM } from 'core/log';

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

  public sleep(): void {
    if (this.isRunning) {
      LM.debug('sleeping timer');
      this.timer?.stop();
      this.isRunning = false;
    }
  }
}
