import { LM as InternalLogger } from 'core/log';
import { EM, StepEvent } from 'core/event';
import { SizedQueue } from 'core/util';
import { Timer } from 'server/util';
import { MetricsEvent } from 'core/metrics';
import { WorldManager } from 'core/entity';
import { NM } from 'core/net';

const LM = InternalLogger.forFile(__filename);

function calculateTps(queue: SizedQueue<number>): number {
  // Calculate tps
  const avgDt = queue.iterator().fold(0, (acc, x) => acc + x) / queue.size();
  return 1 / avgDt;
}

export class MetricsManager {
  public initialize(): void {
    LM.debug('MetricsManager initialized');

    const frameTimes = new SizedQueue<number>(100);

    EM.addListener<StepEvent>('StepEvent', (event) => {
      frameTimes.enqueue(event.data.dt);
    });

    const timer = new Timer(() => {
      const event = {
        type: 'MetricsEvent',
        data: <MetricsEvent>{
          tps: calculateTps(frameTimes),
          entities: WorldManager.getEntityCount(),
          listeners: EM.getListenerCount(),
          connections: 0,
        },
      };

      NetworkManager.send(event);
    }, 1);

    timer.start();
  }
}
