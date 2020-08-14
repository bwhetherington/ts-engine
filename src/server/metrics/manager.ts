import { LogManager } from 'core/log';
import { EventManager, StepEvent } from 'core/event';
import { SizedQueue } from 'core/util';
import { Timer } from 'server/util';
import { MetricsEvent } from 'core/metrics';
import { WorldManager } from 'core/entity';
import { NetworkManager } from 'core/net';

const log = LogManager.forFile(__filename);

function calculateTps(queue: SizedQueue<number>): number {
  // Calculate tps
  const avgDt = queue.iterator().fold(0, (acc, x) => acc + x) / queue.size();
  return 1 / avgDt;
}

export class MetricsManager {
  public initialize(): void {
    log.debug('MetricsManager initialized');

    const frameTimes = new SizedQueue<number>(100);

    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      frameTimes.enqueue(event.data.dt);
    });

    const timer = new Timer(() => {
      const event = {
        type: 'MetricsEvent',
        data: <MetricsEvent>{
          tps: calculateTps(frameTimes),
          entities: WorldManager.getEntityCount(),
          listeners: EventManager.getListenerCount(),
          connections: 0,
        },
      };

      NetworkManager.send(event);
    }, 1);

    timer.start();
  }
}
