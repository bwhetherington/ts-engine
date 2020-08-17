import { Unit, Text, WorldManager, Explosion } from 'core/entity';
import { GraphicsContext } from 'core/graphics';
import { WHITE, Color, reshade } from 'core/graphics/color';
import { Data } from 'core/serialize';
import { FireEvent } from 'core/weapon';
import { NetworkManager } from 'core/net';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

const FIRE_DURATION = 0.25;
const FLASH_DURATION = 0.2;

export class Tank extends Unit {
  public static typeName: string = 'Tank';

  public armor: number = 0;

  protected angle: number = 0;
  protected label?: Text;

  private fireTimer: number = 0;
  private flashTimer: number = 0;
  private flashColor?: Color;

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
  }

  public setColor(color: Color): void {
    super.setColor(color);

    const newColor = this.getColor();
    const flashColor = reshade(newColor, -0.4);
    this.flashColor = flashColor;
  }

  public flash(): void {
    this.flashTimer = FLASH_DURATION;
  }

  public step(dt: number) {
    super.step(dt);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    if (NetworkManager.isClient()) {
      this.label?.setPosition(this.position);
      this.label?.position?.addXY(0, -55);
      this.label?.setPosition(this.position);
      this.label?.position?.addXY(0, -55);
    }
  }

  public damage(amount: number, source?: Unit): void {
    log.trace('damage ' + amount + ', source ' + source?.toString());
    const actualAmount = Math.max(0, amount - this.armor);
    super.damage(actualAmount, source);
    if (actualAmount > 0) {
      this.flash();
    }
  }

  public render(ctx: GraphicsContext): void {
    const color = this.flashTimer > 0 ? (this.flashColor ?? this.getColor()) : this.getColor();
    const oldColor = this.getColor();
    this.setColor(color);
    super.render(ctx);
    const { centerX, centerY } = this.boundingBox;

    // Draw turret
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    // Scale turret to allow it to animate when firing
    const cannonScale = (this.fireTimer / FIRE_DURATION) * 0.2 + 1;
    ctx.setScale(cannonScale);
    ctx.rect(-5, -5, 25, 10, this.getColor());

    // Reset transformations
    ctx.setScale(1 / cannonScale);
    ctx.rotate(-this.angle);
    ctx.translate(-centerX, -centerY);
    this.setColor(oldColor);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      angle: this.angle,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { angle } = data;
    if (typeof angle === 'number') {
      this.angle = angle;
    }
  }

  public markForDelete(): void {
    super.markForDelete();
  }

  public cleanupLocal(): void {
    this.label?.markForDelete();
  }

  public cleanup(): void {
    if (NetworkManager.isClient()) {
      const explosion = WorldManager.spawn(Explosion, this.position);
      explosion.radius = 35;
      explosion.setColor({
        red: 1.0,
        green: 0.6,
        blue: 0.3,
        alpha: 0.8,
      });
    }
    this.label?.markForDelete();
    super.cleanup();
  }
}
