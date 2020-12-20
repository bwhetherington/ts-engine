import {EventManager, StepEvent} from 'core/event';
import {Queue, SizedQueue} from 'core/util';

export class MetricsManager {
  private frameTimes: Queue<number> = new SizedQueue(100);

  public initialize(): void {
    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      this.frameTimes.enqueue(event.data.dt);
    });
  }

  public getAverageFPS(): number {
    if (this.frameTimes.isEmpty()) {
      return -1;
    } else {
      const totalFrameTime = this.frameTimes
        .iterator()
        .fold(0, (acc, x) => acc + x);
      return this.frameTimes.size() / totalFrameTime;
    }
  }
}
