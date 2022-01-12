import {BaseHero} from '@/core/entity';
import {Serializable, Data} from '@/core/serialize';

export class Upgrade implements Serializable {
  public static typeName: string = 'Upgrade';

  public type: string = Upgrade.typeName;
  public name: string = '';
  public description: string = '';
  public isRepeatable: boolean = false;
  public isRare: boolean = false;
  public requires: string[] = [];
  public exclusiveWith: string[] = [];

  public applyTo(_hero: BaseHero) {}

  public serialize(): Data {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      isRepeatable: this.isRepeatable,
      isRare: this.isRare,
      requires: this.requires,
      exclusiveWith: this.exclusiveWith,
    };
  }

  public deserialize(data: Data) {
    const {
      type,
      name,
      description,
      isRepeatable,
      isRare,
      requires,
      exclusiveWith,
    } = data;
    if (typeof type === 'string') {
      this.type = type;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof description === 'string') {
      this.description = description;
    }
    if (typeof isRepeatable === 'boolean') {
      this.isRepeatable = isRepeatable;
    }
    if (typeof isRare === 'boolean') {
      this.isRare = isRare;
    }
    if (requires instanceof Array) {
      this.requires = requires;
    }
    if (exclusiveWith instanceof Array) {
      this.exclusiveWith = exclusiveWith;
    }
  }
}
