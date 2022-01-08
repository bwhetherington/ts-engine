import {BaseHero} from 'core/entity';
import {Serializable, Data} from 'core/serialize';

export class Upgrade implements Serializable {
  public static typeName: string = 'Upgrade';

  public type: string = Upgrade.typeName;
  public name: string = '';
  public description: string = '';
  public isUnique: boolean = false;
  public requires: string[] = [];
  public exclusiveWith: string[] = [];

  public applyTo(_hero: BaseHero) {}

  public serialize(): Data {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      isUnique: this.isUnique,
      requires: this.requires,
      exclusiveWith: this.exclusiveWith,
    };
  }

  public deserialize(data: Data) {
    const {type, name, description, isUnique, requires, exclusiveWith} = data;
    if (typeof type === 'string') {
      this.type = type;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof description === 'string') {
      this.description = description;
    }
    if (typeof isUnique === 'boolean') {
      this.isUnique = isUnique;
    }
    if (requires instanceof Array) {
      this.requires = requires;
    }
    if (exclusiveWith instanceof Array) {
      this.exclusiveWith = exclusiveWith;
    }
  }
}
