import {Player, PlayerLeaveEvent} from '@/core/player';
import {Serializable, Data} from '@/core/serialize';
import {LogManager} from '@/core/log';
import {SyncEvent, NetworkManager} from '@/core/net';
import {EventManager} from '@/core/event';
import {diff} from '@/core/util';
import {Iterator} from '@/core/iterator';
import {isUUID, UUID} from '@/core/uuid';
import {isEmpty} from '@/core/util/object';
import {MetricsEvent} from '@/core/metrics';

const log = LogManager.forFile(__filename);

export class PlayerManager implements Serializable {
  private players: Record<UUID, Player> = {};
  private socketMap: Record<number, Player> = {};
  private previousState: Data = {};
  private activePlayer: number = -1;
  private removed: UUID[] = [];

  public initialize() {
    log.debug('PlayerManager initialized');

    EventManager.streamEvents(SyncEvent).forEach((event) => {
      this.deserialize(event.data.playerData);
    });

    if (NetworkManager.isClient()) {
      EventManager.streamEvents(MetricsEvent).forEach((event) => {
        const {pings} = event.data;
        Iterator.entries(pings).forEach(([id, ping]) => {
          const player = this.getPlayer(id);
          if (player) {
            player.ping = ping;
          }
        });
      });
    }

    if (NetworkManager.isServer()) {
      EventManager.streamInterval(60).forEach(() => this.saveAll());
    }
  }

  public setActivePlayer(socket: number) {
    this.activePlayer = socket;
  }

  public getActivePlayer(): Player | undefined {
    return this.socketMap[this.activePlayer];
  }

  public isActivePlayer(player: Player): boolean {
    return this.activePlayer > -1 && player.socket === this.activePlayer;
  }

  public add(player: Player) {
    const {id} = player;
    this.players[id] = player;
    if (player.socket !== undefined) {
      this.socketMap[player.socket] = player;
    }
  }

  public remove(player: Player | UUID) {
    let id;
    if (isUUID(player)) {
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

      EventManager.emitEvent(PlayerLeaveEvent, {
        player: playerObj,
      });

      this.removed.push(playerObj.id);
    }
  }

  public getPlayer(index?: UUID): Player | undefined {
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

    Iterator.entries(this.players).forEach(([index, player]) => {
      players[index] = player.serialize();
    });

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

  public deserialize(data: Data) {
    const {players, removed} = data;
    if (players) {
      Iterator.entries(players).forEach(([id, playerData]: [string, any]) => {
        let newPlayer = false;
        let player = this.players[id];
        if (!player) {
          player = new Player();
          player.id = id;
          newPlayer = true;
        }
        player.deserialize(playerData);
        if (newPlayer) {
          this.add(player);
        }
      });
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
