import {Hero} from 'core/entity';
import {GraphicsContext} from 'core/graphics';

export class Heavy extends Hero {
  public static typeName = 'Heavy';

  public constructor() {
    super();
    this.type = Heavy.typeName;
    this.mass = 5;
    this.speed = 200;
    this.boundingBox.width = 40;
    this.boundingBox.height = 40;
    this.cannonShape.width = 35;
    this.cannonShape.height = 25;
    this.setWeapon('HeavyGun');
  }

  protected lifeForLevel(level: number): number {
    return 2 * super.lifeForLevel(level);
  }
}
