import {Data, Serializable} from 'core/serialize';
import {Matrix2} from 'core/geometry';
import {Upgrade} from 'core/upgrade';
import {BaseHero} from 'core/entity';

type NumberModifier = Matrix2;

export class HeroModifier implements Serializable {
  public damage: NumberModifier = new Matrix2().identity();
  public pierce: NumberModifier = new Matrix2().identity();
  public rate: NumberModifier = new Matrix2().identity();
  public shotCount: NumberModifier = new Matrix2().identity();
  public shotSpread: NumberModifier = new Matrix2().identity();
  public projectileSpeed: NumberModifier = new Matrix2().identity();
  public projectileDuration: NumberModifier = new Matrix2().identity();
  public projectileSpread: NumberModifier = new Matrix2().identity();
  public life: NumberModifier = new Matrix2().identity();
  public armor: NumberModifier = new Matrix2().identity();

  public serialize(): Data {
    return {
      damage: this.damage.serialize(),
      pierce: this.pierce.serialize(),
      rate: this.rate.serialize(),
      shotCount: this.shotCount.serialize(),
      shotSpread: this.shotSpread.serialize(),
      projectileSpeed: this.projectileSpeed.serialize(),
      projectileDuration: this.projectileDuration.serialize(),
      projectileSpread: this.projectileSpread.serialize(),
    };
  }

  public deserialize(data: Data): void {
    const {
      life,
      armor,
      damage,
      pierce,
      rate,
      shotCount,
      shotSpread,
      projectileSpeed,
      projectileDuration,
      projectileSpread,
    } = data;
    if (life) {
      this.life.deserialize(life);
    }
    if (armor) {
      this.armor.deserialize(armor);
    }
    if (damage) {
      this.damage.deserialize(damage);
    }
    if (pierce) {
      this.pierce.deserialize(pierce);
    }
    if (rate) {
      this.rate.deserialize(rate);
    }
    if (shotCount) {
      this.shotCount.deserialize(shotCount);
    }
    if (shotSpread) {
      this.shotSpread.deserialize(shotSpread);
    }
    if (projectileSpeed) {
      this.projectileSpeed.deserialize(projectileSpeed);
    }
    if (projectileDuration) {
      this.projectileDuration.deserialize(projectileDuration);
    }
    if (projectileSpread) {
      this.projectileSpread.deserialize(projectileSpread);
    }
  }

  public multiply(modifiers: Partial<HeroModifier>): void {
    const {
      armor,
      life,
      damage,
      pierce,
      rate,
      shotCount,
      shotSpread,
      projectileSpeed,
      projectileSpread,
      projectileDuration,
    } = modifiers;
    if (armor) {
      this.armor = this.armor.multiply(armor);
    }
    if (life) {
      this.life = this.life.multiply(life);
    }
    if (damage) {
      this.damage = this.damage.multiply(damage);
    }
    if (pierce) {
      this.pierce = this.pierce.multiply(pierce);
    }
    if (rate) {
      this.rate = this.rate.multiply(rate);
    }
    if (shotCount) {
      this.shotCount = this.shotCount.multiply(shotCount);
    }
    if (shotSpread) {
      this.shotSpread = this.shotSpread.multiply(shotSpread);
    }
    if (projectileSpeed) {
      this.projectileSpeed = this.projectileSpeed.multiply(projectileSpeed);
    }
    if (projectileSpread) {
      this.projectileSpread = this.projectileSpread.multiply(projectileSpread);
    }
    if (projectileDuration) {
      this.projectileDuration = this.projectileDuration.multiply(
        projectileDuration
      );
    }
  }
}

export class ModifierUpgrade extends Upgrade {
  public constructor(private modifiers: Partial<HeroModifier>) {
    super();
  }

  public override applyTo(hero: BaseHero): void {
    hero.modifiers.multiply(this.modifiers);
  }
}
