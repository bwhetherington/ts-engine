import { Player } from 'core/player';
import { Serializable, Data } from 'core/serialize';
import { LM as InternalLogger } from 'core/log';
import { SyncEvent } from 'core/net';
import { EM } from 'core/event';
import { diff } from 'core/util';

const LM = InternalLogger.forFile(__filename);

export class PlayerManager implements Serializable {
  private players: Record<string, Player> = {};
  private socketMap: Record<number, Player> = {};
  private previousState: Data = {};
  private activePlayer: number = -1;

  public initialize(): void {
    LM.debug('PlayerManager initialized');

    EM.addListener<SyncEvent>('SyncEvent', (event) => {
      this.deserialize(event.data.playerData);
    });
  }

  public setActivePlayer(socket: number): void {
    this.activePlayer = socket;
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

  public remove(player: Player | string): void {
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
    const obj: Data = {};
    for (const index in this.players) {
      obj[index] = this.players[index].serialize();
    }
    return obj;
  }

  public deserialize(data: Data): void {
    for (const index in data) {
      let player = this.players[index];
      if (!player) {
        player = new Player();
      }
      player.deserialize(data[index]);
    }
  }

  public diffState(): Data {
    const diffObj = {};
    const newState = this.serialize();
    diff(this.previousState, newState, diffObj);
    this.previousState = newState;
    return diffObj;
  }
}
