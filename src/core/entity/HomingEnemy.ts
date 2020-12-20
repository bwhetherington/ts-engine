import {GraphicsContext} from 'core/graphics';
import {Enemy} from 'core/entity';

export class HomingEnemy extends Enemy {
  public static typeName = 'HomingEnemy';

  public constructor() {
    super();
    this.type = HomingEnemy.typeName;
    this.setWeapon('HomingGun');
  }

  protected renderCannon(ctx: GraphicsContext): void {
    const color = this.getColor();
    const horizontalScale = this.getFireParameter();
    const verticalScale = horizontalScale / 2 + 0.5;

    ctx.trapezoid(
      this.cannonShape.width / 2,
      0,
      this.cannonShape.height * 1.4 * verticalScale,
      this.cannonShape.height * 0.8 * verticalScale,
      this.cannonShape.width * horizontalScale,
      color
    );
  }
}
