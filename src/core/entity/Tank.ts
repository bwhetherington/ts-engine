import { Unit, Text, WorldManager } from "core/entity";
import { GraphicsContext } from "core/graphics";
import { StepEvent } from "core/event";
import { DamageEvent } from "./util";
import { WHITE } from "core/graphics/color";
import { Data } from "core/serialize";
import { FireEvent } from "core/weapon";
import { NetworkManager } from "core/net";
import { Explosion } from "./Explosion";

const FIRE_DURATION = 0.25;
const FLASH_DURATION = 0.2;

export class Tank extends Unit {
  public static typeName: string = 'Tank';

  protected angle: number = 0;
  protected label?: Text;

  private fireTimer: number = 0;
  private flashTimer: number = 0;

  public constructor() {
    super();
    this.type = Tank.typeName;

    this.boundingBox.width = 30;
    this.boundingBox.height = 30;

    this.setMaxLife(100);
    this.setLife(100);

    this.addListener<FireEvent>('FireEvent', (event) => {
      if (this.id === event.data.sourceID) {
        this.fireTimer = FIRE_DURATION;
      }
    });

    if (NetworkManager.isClient()) {
      this.label = WorldManager.spawn(Text);
      this.label.text = 'Tank';
    }
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

      if (this.label) {
        this.label?.setPosition(this.position);
        this.label?.position?.addXY(0, -55);
      }
    }
  }

  public damage(amount: number, source?: Unit): void {
    super.damage(amount, source);
    this.flash();
  }

  public render(ctx: GraphicsContext): void {
    const color = this.flashTimer > 0 ? WHITE : this.color;
    const oldColor = this.color;
    this.color = color;
    super.render(ctx);
    const { centerX, centerY } = this.boundingBox;

    // Draw turret
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    // Scale turret to allow it to animate when firing
    const cannonScale = (this.fireTimer / FIRE_DURATION) * 0.2 + 1;
    ctx.setScale(cannonScale);
    ctx.rect(-5, -5, 25, 10, this.color);

    // Reset transformations
    ctx.setScale(1 / cannonScale);
    ctx.rotate(-this.angle);
    ctx.translate(-centerX, -centerY);
    this.color = oldColor;
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
    this.label?.markForDelete();
  }

  public cleanup(): void {
    if (NetworkManager.isClient()) {
      const explosion = WorldManager.spawn(Explosion, this.position);
      explosion.radius = 35;
      explosion.color = {
        red: 1.0,
        green: 0.6,
        blue: 0.3,
        alpha: 0.8,
      };
    }
    super.cleanup();
  }
}