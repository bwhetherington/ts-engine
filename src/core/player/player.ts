import { Hero, WM } from 'core/entity';
import { Serializable, Data } from 'core/serialize';
import { v1 } from 'uuid';
import { Socket } from 'core/net';

export class Player implements Serializable {
  public name: string = 'Anonymous';
  public id: string;
  public hero?: Hero;
  public socket?: Socket;

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
    };
  }

  public deserialize(data: Data): void {
    const { name, id, heroID } = data;
    if (typeof id === 'string') {
      this.id = id;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof heroID == 'string') {
      const entity = WM.getEntity(heroID);
      if (entity instanceof Hero) {
        this.hero = entity;
      }
    }
  }

  public cleanup(): void {
    this.hero?.markForDelete();
  }
}
