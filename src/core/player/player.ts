import { Hero, WM } from 'core/entity';
import { Serializable, Data } from 'core/serialize';
import { Socket, NM } from 'core/net';
import { PlayerManager } from 'core/player';
import { UM, UUID } from 'core/uuid';

export class Player implements Serializable {
  public name: string = 'Anonymous';
  public id: string;
  public hero?: Hero;
  public socket: Socket = -1;

  public constructor(id?: UUID) {
    if (id) {
      this.id = id;
    } else {
      this.id = UM.generate();
    }
  }

  public serialize(): Data {
    return {
      name: this.name,
      heroID: this.hero?.id ?? null,
      socket: this.socket,
    };
  }

  public deserialize(data: Data): void {
    const { name, id, socket, heroID } = data;
    if (typeof id === 'string') {
      this.id = id;
    }
    if (typeof name === 'string') {
      console.log('name', name);
      this.name = name;
    }
    if (typeof socket === 'number') {
      this.socket = socket;
    }
    if (typeof heroID == 'string') {
      const entity = WM.getEntity(heroID);
      if (entity instanceof Hero) {
        this.setHero(entity);
      }
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
    UM.free(this.id);
  }

  public isActivePlayer(): boolean {
    return PlayerManager.isActivePlayer(this);
  }

  public send(packet: Data): void {
    if (this.socket > -1) {
      NM.send(packet, this.socket);
    }
  }
}
