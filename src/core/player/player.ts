import { Hero, WM } from 'core/entity';
import { Serializable, Data } from 'core/serialize';
import { v1 } from 'uuid';
import { Socket, NM } from 'core/net';
import { PM } from '.';

export class Player implements Serializable {
  public name: string = 'Anonymous';
  public id: string;
  public hero?: Hero;
  public socket: Socket = -1;

  public constructor(id?: string) {
    if (id) {
      this.id = id;
    } else {
      this.id = v1();
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
  }

  public isActivePlayer(): boolean {
    return PM.isActivePlayer(this);
  }

  public send(packet: Data): void {
    if (this.socket > -1) {
      NM.send(packet, this.socket);
    }
  }
}
