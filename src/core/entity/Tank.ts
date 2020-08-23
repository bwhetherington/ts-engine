import { Unit, Text, Bar, WorldManager, Explosion } from 'core/entity';
import { GraphicsContext } from 'core/graphics';
import { WHITE, Color, reshade, rgb } from 'core/graphics/color';
import { Data } from 'core/serialize';
import { FireEvent, Weapon, WeaponManager } from 'core/weapon';
import { NetworkManager } from 'core/net';
import { LogManager } from 'core/log';
import { Rectangle, Vector } from 'core/geometry';

const log = LogManager.forFile(__filename);

const FIRE_DURATION = 0.25;

export class Tank extends Unit {
  public static typeName: string = 'Tank';

  public armor: number = 0;
  public angle: number = 0;

  protected cannonShape: Rectangle = new Rectangle(25, 15);

  private fireTimer: number = 0;
  private hasExploded: boolean = false;
  private weapon?: Weapon;

  public constructor() {
    super();
    this.type = Tank.typeName;
    this.friction = 500;
    this.bounce = 0.1;

    this.boundingBox.width = 30;
    this.boundingBox.height = 30;

    this.setMaxLife(10);
    this.setLife(10);

    this.addListener<FireEvent>('FireEvent', (event) => {
      if (this.id === event.data.sourceID) {
        this.fireTimer = FIRE_DURATION;
      }
    });

    if (NetworkManager.isClient()) {
      this.label = WorldManager.spawn(Text, this.position);
    }
  }

  public step(dt: number) {
    super.step(dt);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
  }

  public damage(amount: number, source?: Unit): void {
    log.trace('damage ' + amount + ', source ' + source?.toString());
    if (amount > 0) {
      const actualAmount = Math.max(1, amount - this.armor);
      super.damage(actualAmount, source);
    }
  }

  protected renderCannon(ctx: GraphicsContext): void { }

  public render(ctx: GraphicsContext): void {
    const color = this.getColor();

    const { x, y, width, height, centerX, centerY } = this.boundingBox;

    // Draw turret
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    // Scale turret to allow it to animate when firing
    const horizontalScale = (this.fireTimer / FIRE_DURATION) * 0.2 + 1;
    const verticalScale = horizontalScale / 2 + 0.5;
    // ctx.setScale(cannonScale);
    ctx.rect(
      0,
      -(this.cannonShape.height * verticalScale) / 2,
      this.cannonShape.width * horizontalScale,
      this.cannonShape.height * verticalScale,
      color
    );

    // Reset transformations
    // ctx.setScale(1 / cannonScale);
    ctx.rotate(-this.angle);
    ctx.translate(-centerX, -centerY);

    // Draw body
    ctx.ellipse(x, y, width, height, color);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      angle: this.angle,
      cannonShape: this.cannonShape,
      weapon: this.weapon?.serialize(),
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { angle, cannonShape, weapon } = data;
    if (typeof angle === 'number') {
      this.angle = angle;
    }
    if (cannonShape) {
      this.cannonShape.deserialize(cannonShape);
    }
    if (weapon) {
      const { type } = weapon;
      if (typeof weapon === 'string') {
        if (this.weapon?.type !== weapon) {
          const newWeapon = WeaponManager.createWeapon(weapon);
          this.setWeapon(newWeapon);
        }
      } else if (type && this.weapon?.type !== type) {
        const newWeapon = WeaponManager.createWeapon(type);
        if (newWeapon) {
          newWeapon.deserialize(weapon);
          this.setWeapon(newWeapon);
        }
      } else {
        this.weapon?.deserialize(weapon);
      }
    }
  }

  public markForDelete(): void {
    super.markForDelete();
  }

  public cleanup(): void {
    this.weapon?.cleanup();
    super.cleanup();
  }

  protected explode(): void {
    const explosion = WorldManager.spawn(Explosion, this.position);
    explosion.radius = 35;
    explosion.setColor({
      red: 1.0,
      green: 0.6,
      blue: 0.3,
      alpha: 0.8,
    });
    this.hasExploded = true;
  }

  public kill(source?: Unit): void {
    super.kill(source);
    if (NetworkManager.isClient() && !this.hasExploded) {
      this.explode();
    }
  }

  public getCannonTip(): Vector {
    this.vectorBuffer.set(this.position);
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    this.vectorBuffer.addXY(dx, dy, this.cannonShape.width);
    return this.vectorBuffer;
  }

  public fire(angle: number): void {
    this.weapon?.fireInternal(this, angle);
  }

  public setWeapon(weapon?: Weapon | string): void {
    let actualWeapon: Weapon | undefined;
    if (typeof weapon === 'string') {
      actualWeapon = WeaponManager.createWeapon(weapon);
    } else if (weapon) {
      actualWeapon = weapon;
    }
    if (this.weapon && this.weapon !== actualWeapon) {
      this.weapon.cleanup();
      this.weapon = actualWeapon;
    } else if (actualWeapon) {
      this.weapon = actualWeapon;
    }
  }
}
