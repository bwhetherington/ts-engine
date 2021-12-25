import {Timer} from 'server/util';
import {LogManager} from 'core/log';

const log = LogManager.forFile(__filename);

export class TimerManager {
  private timer?: Timer;
  private isRunning: boolean = false;

  public initialize(timer: Timer) {
    this.timer = timer;
    log.debug('TimerManager initialized');
  }

  public wake() {
    if (!this.isRunning) {
      log.debug('waking timer');
      this.timer?.start();
      this.isRunning = true;
    }
  }

  public setInterval(interval: number) {
    if (this.timer) {
      this.timer.interval = interval;
    }
  }

  public sleep() {
    if (this.isRunning) {
      log.debug('sleeping timer');
      this.timer?.stop();
      this.isRunning = false;
    }
  }
}
