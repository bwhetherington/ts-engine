import { Data, Serializable } from 'core/serialize';
import { Matrix2 } from 'core/geometry';

type NumberModifier = Matrix2;

export class WeaponModifier implements Serializable {
  public damage: NumberModifier = new Matrix2().identity();
  public pierce: NumberModifier = new Matrix2().identity();
  public rate: NumberModifier = new Matrix2().identity();
  public shotCount: NumberModifier = new Matrix2().identity();
  public shotSpread: NumberModifier = new Matrix2().identity();
  public projectileSpeed: NumberModifier = new Matrix2().identity();
  public projectileDuration: NumberModifier = new Matrix2().identity();
  public projectileSpread: NumberModifier = new Matrix2().identity();

  private matrixBuffer: NumberModifier = new Matrix2().identity();

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
      damage,
      pierce,
      rate,
      shotCount,
      shotSpread,
      projectileSpeed,
      projectileDuration,
      projectileSpread,
    } = data;
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

  public chainModifier(stat: string, coefficient: number, constant: number): void {
    const modifier = (this as any)[stat];
    if (modifier instanceof Matrix2) {
      modifier.setFields(coefficient, constant);
    }
  }
}
