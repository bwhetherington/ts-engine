import {BaseHero} from 'core/entity';
import {Serializable, Data} from 'core/serialize';

export class Upgrade implements Serializable {
  public static typeName: string = 'Upgrade';

  public type: string = Upgrade.typeName;
  public name: string = '';
  public description: string = '';

  public applyTo(_hero: BaseHero) {}

  public serialize(): Data {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
    };
  }

  public deserialize(data: Data) {
    const {type, name, description} = data;
    if (typeof type === 'string') {
      this.type = type;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof description === 'string') {
      this.description = description;
    }
  }
}
