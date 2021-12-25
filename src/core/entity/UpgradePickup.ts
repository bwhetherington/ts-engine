import {Pickup, BaseHero} from 'core/entity';
import {Data} from 'core/serialize';
import {UpgradeManager} from 'core/upgrade';

export class UpgradePickup extends Pickup {
  public static typeName: string = 'UpgradePickup';
  public upgrade?: string;

  protected override onPickup(unit: BaseHero) {
    if (!this.upgrade) {
      return;
    }

    const upgrade = UpgradeManager.instantiate(this.upgrade);
    if (!upgrade) {
      return;
    }

    upgrade.applyTo(unit);
    super.onPickup(unit);
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      upgrade: this.upgrade,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);
    const {upgrade} = data;
    if (typeof upgrade === 'string') {
      this.upgrade = upgrade;
    }
  }
}
