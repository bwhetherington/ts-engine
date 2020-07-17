import { Player } from 'core/player';
import { Serializable, Data } from 'core/serialize';
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

export class PlayerManager implements Serializable {
  private players: Record<string, Player> = {};

  public initialize(): void {
    LM.debug('PlayerManager initialized');
  }

  public add(player: Player): void {
    const { id } = player;
    this.players[id] = player;
  }

  public remove(player: Player | number): void {
    if (typeof player === 'number') {
      delete this.players[player];
    } else {
      delete this.players[player.id];
    }
  }

  public getPlayer(index: number): Player | undefined {
    return this.players[index];
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
    }
  }
}
