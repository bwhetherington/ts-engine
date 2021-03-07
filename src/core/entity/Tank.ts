import {Unit, Text, WorldManager} from 'core/entity';
import {GraphicsContext, hsv} from 'core/graphics';
import {Data} from 'core/serialize';
import {FireEvent, Weapon, WeaponManager} from 'core/weapon';
import {NetworkManager} from 'core/net';
import {LogManager} from 'core/log';
import {CannonShape, Rectangle, Vector} from 'core/geometry';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {Iterator} from 'core/iterator';
import {EventManager} from 'core/event';
import {clamp} from 'core/util';

const log = LogManager.forFile(__filename);

const FIRE_DURATION = 0.25;

export type ShapeType = CircleType | PolygonType;

export interface CircleType {
  tag: 'circle';
}

export interface PolygonType {
  tag: 'polygon';
  sides: number;
  angle?: number;
}

interface TankCannon {
  key: number;
  shape: CannonShape;
  lastFired: number;
}

function getFireParameter(lastFired: number): number {
  const t = 1 - clamp((EventManager.timeElapsed - lastFired) / FIRE_DURATION, 0, 1);
  return t * 0.2 + 1;
}

export class Tank extends Unit {
  public static typeName: string = 'Tank';

  public armor: number = 0;

  protected cannonIndex: number = 0;
  protected cannons: TankCannon[] = [
    {
      shape: new CannonShape(25, 15),
      lastFired: 0,
      key: 0,
    },
  ];

  protected bodyShape: ShapeType = {
    tag: 'circle',
  };

  private fireTimer: number = 0;
  protected weapon?: Weapon;

  public constructor() {
    super();
    this.type = Tank.typeName;
    this.friction = 500;
    this.bounce = 0.1;

    this.boundingBox.width = 30;
    this.boundingBox.height = 30;

    this.setMaxLife(50);
    this.setLife(50);

    if (NetworkManager.isClient()) {
      this.label = WorldManager.spawn(Text, this.position);
      this.streamEvents<FireEvent>('FireEvent')
        .filter(({data: {sourceID}}) => sourceID === this.id)
        .forEach(({data: {cannonIndex}}) => {
          this.cannons[cannonIndex].lastFired = EventManager.timeElapsed;
        });
    }
  }

  public step(dt: number) {
    super.step(dt);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
  }

  public calculateDamageIn(amount: number): number {
    return Math.max(1, amount - this.armor);
  }

  protected getFireParameter(): number {
    return (this.fireTimer / FIRE_DURATION) * 0.2 + 1;
  }

  protected renderBody(ctx: GraphicsContext): void {
    const {width} = this.boundingBox;
    const radius = width / 2;
    if (this.bodyShape.tag === 'circle') {
      ctx.ellipse(-radius, -radius, radius * 2, radius * 2, this.getColor());
    } else if (this.bodyShape.tag === 'polygon') {
      ctx.regularPolygon(
        0,
        0,
        this.bodyShape.sides,
        radius,
        this.getColor(),
        this.bodyShape.angle
      );
    }
  }

  protected renderCannonShape(ctx: GraphicsContext, cannon: TankCannon): void {
    const color = this.getColor();

    const {shape, lastFired} = cannon;
    const horizontalScale = getFireParameter(lastFired);
    const verticalScale = horizontalScale / 2 + 0.5;

    GraphicsPipeline.pipe()
      .rotate(shape.angle)
      .run(ctx, (ctx) => {
        if (shape.farHeight !== undefined) {
          // Trapezoid cannon
          ctx.trapezoid(
            shape.offset.x + shape.length / 2,
            shape.offset.y + 0,
            shape.height * verticalScale,
            shape.farHeight * verticalScale,
            shape.length * horizontalScale,
            color
          );
        } else {
          // Rectangle cannon
          ctx.rect(
            shape.offset.x + 0,
            shape.offset.y - (shape.height * verticalScale) / 2,
            shape.length * horizontalScale,
            shape.height * verticalScale,
            color
          );
        }
      });
  }

  public getCannonIndex(): number {
    return this.cannonIndex;
  }

  public incrementCannonIndex(): void {
    this.cannonIndex = (this.cannonIndex + 1) % this.cannons.length;
  }

  protected renderCannon(ctx: GraphicsContext): void {
    Iterator.array(this.cannons).forEach(
      this.renderCannonShape.bind(this, ctx)
    );
  }

  public render(ctx: GraphicsContext): void {
    GraphicsPipeline.pipe().run(ctx, (ctx) => {
      this.renderCannon(ctx);
      this.renderBody(ctx);
    });
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      cannons: this.cannons.map(({lastFired, shape, key}) => ({
        key,
        lastFired,
        shape: shape.serialize(),
      })),
      weapon: this.weapon?.serialize(),
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {cannons, bodyShape, weapon} = data;
    if (cannons instanceof Array) {
      Iterator.array(cannons)
        .filter((obj) => !!obj?.shape)
        .forEach(({shape, key}) => {
          if (typeof key === 'number') {
            const cannon = new CannonShape(0, 0);
            cannon.deserialize(shape);
            this.cannons[key] = {
              key,
              lastFired: this.cannons[key]?.lastFired ?? 0,
              shape: cannon,
            };
          }
        });
    }
    if (bodyShape) {
      // TODO Add type checking
      if (bodyShape.tag === 'polygon') {
        const {tag, sides, angle} = bodyShape;
        this.bodyShape = {
          tag,
          sides,
          angle: angle !== undefined ? (angle * Math.PI) / 180 : undefined,
        };
      } else {
        this.bodyShape = bodyShape;
      }
    }
    if (weapon) {
      const {type} = weapon;
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

  public getCannonTip(): Vector {
    const cannon = this.cannons[this.cannonIndex];
    cannon?.shape?.getTip(
      this.position.x,
      this.position.y,
      this.angle,
      this.vectorBuffer
    );
    return this.vectorBuffer;
  }

  public getCannonAngle(): number {
    return this.cannons[this.cannonIndex]?.shape?.angle ?? 0;
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
