import { Player, PlayerLeaveEvent } from 'core/player';
import { Serializable, Data } from 'core/serialize';
import { LogManager } from 'core/log';
import { SyncEvent, NetworkManager } from 'core/net';
import { EventManager } from 'core/event';
import { diff } from 'core/util';
import { Iterator, iterateObject } from 'core/iterator';
import { UUID } from 'core/uuid';
import { isEmpty } from 'core/util/object';
import { MetricsEvent } from 'core/metrics';

const log = LogManager.forFile(__filename);

export class PlayerManager implements Serializable {
  private players: Record<UUID, Player> = {};
  private socketMap: Record<number, Player> = {};
  private previousState: Data = {};
  private activePlayer: number = -1;
  private removed: UUID[] = [];

  public initialize(): void {
    log.debug('PlayerManager initialized');

    EventManager.addListener<SyncEvent>('SyncEvent', (event) => {
      this.deserialize(event.data.playerData);
    });

    if (NetworkManager.isClient()) {
      EventManager.addListener<MetricsEvent>('MetricsEvent', (event) => {
        const { pings } = event.data;
        for (const id in pings) {
          const player = this.getPlayer(id);
          if (player) {
            const ping = pings[id];
            if (typeof ping === 'number') {
              player.ping = pings[id];
            }
          }
        }
      });
    }
  }

  public setActivePlayer(socket: number): void {
    this.activePlayer = socket;
  }

  public getActivePlayer(): Player | undefined {
    return this.socketMap[this.activePlayer];
  }

  public isActivePlayer(player: Player): boolean {
    return this.activePlayer > -1 && player.socket === this.activePlayer;
  }

  public add(player: Player): void {
    const { id } = player;
    this.players[id] = player;
    if (player.socket !== undefined) {
      this.socketMap[player.socket] = player;
    }
  }

  public remove(player: Player | UUID): void {
    let id;
    if (typeof player === 'string') {
      id = player;
    } else {
      id = player.id;
    }

    const playerObj = this.players[id];
    if (playerObj) {
      playerObj.cleanup();

      delete this.players[playerObj.id];
      if (playerObj.socket !== undefined) {
        delete this.socketMap[playerObj.socket];
      }

      EventManager.emit<PlayerLeaveEvent>({
        type: 'PlayerLeaveEvent',
        data: {
          player: playerObj
        }
      });

      this.removed.push(playerObj.id);
    }
  }

  public getPlayer(index?: string | number): Player | undefined {
    if (typeof index === 'string') {
      return this.players[index];
    } else if (typeof index === 'number') {
      return this.socketMap[index];
    } else {
      return undefined;
    }
  }

  public serialize(): Data {
    const players: Data = {};
    for (const index in this.players) {
      players[index] = this.players[index].serialize();
    }
    const { removed } = this;
    this.removed = [];

    const obj: Data = {};
    if (!isEmpty(players)) {
      obj.players = players;
    }
    if (removed.length > 0) {
      obj.removed = removed;
    }
    return obj;
  }

  public deserialize(data: Data): void {
    // console.log(data);
    const { players, removed } = data;
    if (players) {
      for (const index in players) {
        let newPlayer = false;
        let player = this.players[index];
        if (!player) {
          player = new Player();
          player.id = index;
          newPlayer = true;
        }
        player.deserialize(players[index]);
        if (newPlayer) {
          this.add(player);
        }
      }
    }
    if (removed) {
      for (const id of removed) {
        this.remove(id);
      }
    }
  }

  public diffState(): Data {
    const diffObj = {};
    const newState = this.serialize();
    diff(this.previousState, newState, diffObj);
    this.previousState = newState;
    return diffObj;
  }

  public getPlayers(): Iterator<Player> {
    return iterateObject(this.players);
  }

  public lookup(name: string): Player[] {
    return this.getPlayers()
      .filter((player) => player.name === name)
      .toArray();
  }

  public findPlayer(name: string): Player | undefined {
    const players = this.lookup(name);
    if (players.length === 1) {
      return players[0];
    } else {
      return undefined;
    }
  }
}
