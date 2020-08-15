import { Hero, WorldManager } from 'core/entity';
import { Serializable, Data } from 'core/serialize';
import { Socket, NetworkManager } from 'core/net';
import { PlayerManager } from 'core/player';
import { UUIDManager, UUID } from 'core/uuid';

export class Player implements Serializable {
  public name: string = 'Anonymous';
  public id: string;
  public hero?: Hero;
  public socket: Socket = -1;

  public score: number = 0;

  public constructor(id?: UUID) {
    if (id) {
      this.id = id;
    } else {
      this.id = UUIDManager.generate();
    }
  }

  public serialize(): Data {
    return {
      name: this.name,
      heroID: this.hero?.id ?? null,
      socket: this.socket,
      score: this.score,
    };
  }

  public deserialize(data: Data): void {
    const { name, id, socket, heroID, score } = data;
    if (typeof id === 'string') {
      this.id = id;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof socket === 'number') {
      this.socket = socket;
    }
    if (typeof heroID == 'string') {
      const entity = WorldManager.getEntity(heroID);
      if (entity instanceof Hero) {
        this.setHero(entity);
      }
    }
    if (typeof score === 'number') {
      this.score = score;
    }
  }

  public setHero(hero: Hero): void {
    this.hero = hero;
    if (hero.getPlayer() !== this) {
      hero.setPlayer(this);
    }
  }

  public cleanup(): void {
    this.hero?.markForDelete();
    UUIDManager.free(this.id);
  }

  public isActivePlayer(): boolean {
    return PlayerManager.isActivePlayer(this);
  }

  public send(packet: Data): void {
    if (this.socket > -1) {
      NetworkManager.send(packet, this.socket);
    }
  }
}
