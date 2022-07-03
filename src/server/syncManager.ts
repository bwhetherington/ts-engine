import {WorldManager} from '@/core/entity';
import {Event, Observer, Priority, StepEvent} from '@/core/event';
import {NetworkManager, SyncEvent} from '@/core/net';
import {PlayerManager} from '@/core/player';
import {isEmpty} from '@/core/util/object';

import {Config} from '@/server/config';

export class SyncManager extends Observer {
  private isFlaggedForFullSync: boolean = false;

  public initialize(config: Config) {
    // Flag for full sync ever 5 seconds
    this.streamInterval(config.fullSyncInterval, Priority.Highest).forEach(
      () => {
        this.isFlaggedForFullSync = true;
      }
    );

    this.streamEvents(StepEvent, Priority.Lowest)
      .map(() => {
        const event: Event<SyncEvent> = {
          type: 'SyncEvent',
          data: {
            worldData: {},
            playerData: {},
          },
        };
        if (this.isFlaggedForFullSync) {
          this.isFlaggedForFullSync = false;
          event.data.worldData = WorldManager.serialize();
          event.data.playerData = PlayerManager.serialize();
        } else {
          // Send only diff
          event.data.worldData = WorldManager.diffState();
          event.data.playerData = PlayerManager.diffState();
        }
        return event;
      })
      .filter(
        (event) =>
          !(isEmpty(event.data.worldData) && isEmpty(event.data.playerData))
      )
      .forEach((event) => NetworkManager.sendEvent(event));
  }
}
