import {LogManager} from 'core/log';
import {EventManager, StepEvent} from 'core/event';
import {SizedQueue} from 'core/util';
import {Timer} from 'server/util';
import {MetricsEvent} from 'core/metrics';
import {WorldManager} from 'core/entity';
import {NetworkManager} from 'core/net';
import {UUID, UUIDManager} from 'core/uuid';
import {Player} from 'core/player';

const log = LogManager.forFile(__filename);

function calculateTps(queue: SizedQueue<number>): number {
  // Calculate tps
  const sum = queue.iterator().fold(0, (acc, x) => acc + x);
  return queue.size() / sum;
}

export class MetricsManager {
  private timer: number = 0;
  private pings: Record<UUID, number> = {};

  public recordPing(player: Player, ping: number): void {
    this.pings[player.id] = ping;
    player.ping = ping;
  }

  public removePlayer(player: Player): void {
    delete this.pings[player.id];
  }

  public initialize(): void {
    log.debug('MetricsManager initialized');

    const frameTimes = new SizedQueue<number>(100);

    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      frameTimes.enqueue(event.data.dt);
      this.timer += event.data.dt;
      if (this.timer > 1) {
        this.timer %= 1;
        NetworkManager.sendEvent<MetricsEvent>({
          type: 'MetricsEvent',
          data: {
            tps: calculateTps(frameTimes),
            entities: WorldManager.getEntityCount(),
            listeners: EventManager.getListenerCount(),
            connections: 0,
            timeElapsed: EventManager.timeElapsed,
            pings: this.pings,
            uuids: UUIDManager.getCount(),
          },
        });
      }
    });
  }
}
