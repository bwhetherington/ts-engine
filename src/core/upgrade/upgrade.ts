import {BaseHero} from 'core/entity';
import { Serializable, Data } from 'core/serialize';

export abstract class Upgrade implements Serializable {
  public name: string = '';
  public description: string = '';
  public abstract applyTo(hero: BaseHero): void;

  public serialize(): Data {
    return {
      name: this.name,
      description: this.description,
    };
  }

  public deserialize(data: Data): void {
    const {name, description} = data;
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof description === 'string') {
      this.description === description;
    }
  }
}
