import {WorldManager} from 'core/entity';
import {EventManager, Observer, Priority, Event, StepEvent} from 'core/event';
import {NetworkManager, SyncEvent} from 'core/net';
import {PlayerManager} from 'core/player';
import {isEmpty} from 'core/util/object';
import {ChatManager} from './chat';

export class SyncManager extends Observer {
  private isFlaggedForFullSync: boolean = false;

  public sync() {
    const event: Event<SyncEvent> = {
      type: 'SyncEvent',
      data: {
        worldData: {},
        playerData: {},
      },
    };
    if (this.isFlaggedForFullSync) {
      event.data.worldData = WorldManager.serialize();
      event.data.playerData = WorldManager.serialize();
      this.isFlaggedForFullSync = false;
    } else {
      // Send only diff
      event.data.worldData = WorldManager.diffState();
      event.data.playerData = WorldManager.diffState();
    }
    if (!(isEmpty(event.data.worldData) && isEmpty(event.data.playerData))) {
      NetworkManager.sendEvent(event);
    }
  }

  public initialize(): void {
    // Flag for full sync ever 5 seconds
    this.streamInterval(5, Priority.Highest).forEach(() => {
      this.isFlaggedForFullSync = true;
    });

    this.streamEvents<StepEvent>('StepEvent', Priority.Lowest)
      .map(() => {
        const event: Event<SyncEvent> = {
          type: 'SyncEvent',
          data: {
            worldData: {},
            playerData: {},
          },
        };
        if (this.isFlaggedForFullSync) {
          ChatManager.info('Full sync');
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
      .filter((event) => !(isEmpty(event.data.worldData) && isEmpty(event.data.playerData)))
      .forEach((event) => NetworkManager.sendEvent(event));
  }
}
