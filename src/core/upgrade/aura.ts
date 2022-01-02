import {Aura, BaseHero, WorldManager} from 'core/entity';
import {Data} from 'core/serialize';
import {Upgrade} from 'core/upgrade';

export class AuraUpgrade extends Upgrade {
  public static typeName: string = 'AuraUpgrade';

  private aura: string = 'Aura';

  public applyTo(hero: BaseHero) {
    const aura = WorldManager.spawnEntity(this.aura);
    if (!aura) {
      return;
    }

    if (aura instanceof Aura) {
      aura.initialize(hero);
      hero.addAura(aura);
    } else {
      aura.markForDelete();
    }
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      aura: this.aura,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);
    const {aura} = data;
    if (typeof aura === 'string') {
      this.aura = aura;
    }
  }
}
