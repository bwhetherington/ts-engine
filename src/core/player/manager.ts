import {Player, PlayerLeaveEvent} from 'core/player';
import {Serializable, Data} from 'core/serialize';
import {LogManager} from 'core/log';
import {SyncEvent, NetworkManager} from 'core/net';
import {EventManager} from 'core/event';
import {diff} from 'core/util';
import {Iterator} from 'core/iterator';
import {UUID, UUIDManager} from 'core/uuid';
import {isEmpty} from 'core/util/object';
import {MetricsEvent} from 'core/metrics';

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
        const {pings} = event.data;
        for (const index in pings) {
          const id = UUIDManager.from(index);
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

    if (NetworkManager.isServer()) {
      EventManager.streamInterval(60).forEach(() => this.saveAll());
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
    const {id} = player;
    this.players[id] = player;
    if (player.socket !== undefined) {
      this.socketMap[player.socket] = player;
    }
  }

  public remove(player: Player | UUID): void {
    let id;
    if (typeof player === 'number') {
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
          player: playerObj,
        },
      });

      this.removed.push(playerObj.id);
    }
  }

  public getPlayer(index?: number): Player | undefined {
    if (index !== undefined) {
      return this.players[index];
    } else {
      return undefined;
    }
  }

  public getSocket(index?: number): Player | undefined {
    if (index !== undefined) {
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
    const {removed} = this;
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
    const {players, removed} = data;
    if (players) {
      for (const index in players) {
        const id = UUIDManager.from(index);
        let newPlayer = false;
        let player = this.players[id];
        if (!player) {
          player = new Player();
          player.id = id;
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
    return Iterator.values(this.players);
  }

  public lookup(name: string): Player[] {
    return this.getPlayers()
      .filter((player) => player.name.toLowerCase() === name.toLowerCase())
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

  public async saveAll(): Promise<void> {
    log.trace('saving all players');
    await Promise.all(this.getPlayers().map((player) => player.save()));
    log.trace('all players saved');
  }

  public async cleanup(): Promise<void> {
    // Save all players currently connected
    await this.saveAll();
  }
}
