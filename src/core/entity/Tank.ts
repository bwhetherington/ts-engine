import {Unit} from '@/core/entity';
import {GraphicsContext} from '@/core/graphics';
import {Data} from '@/core/serialize';
import {FireEvent, Weapon, WeaponManager} from '@/core/weapon';
import {NetworkManager} from '@/core/net';
import {CannonShape, Vector} from '@/core/geometry';
import {GraphicsPipeline} from '@/core/graphics/pipe';
import {Iterator} from '@/core/iterator';
import {EventManager} from '@/core/event';
import {clamp} from '@/core/util';
import {HeroModifier} from '@/core/upgrade';

const FIRE_DURATION = 0.25;

export type ShapeType = CircleType | PolygonType;

export interface CircleType {
  tag: 'circle';
  lockToWeapon?: boolean;
  ignoreAngle?: true;
  radius?: number;
}

export interface PolygonType {
  tag: 'polygon';
  lockToWeapon?: boolean;
  ignoreAngle?: boolean;
  sides: number;
  angle?: number;
  radius?: number;
}

interface TankCannon {
  key: number;
  shape: CannonShape;
  lastFired: number;
}

function getFireParameter(lastFired: number): number {
  const t =
    1 - clamp((EventManager.timeElapsed - lastFired) / FIRE_DURATION, 0, 1);
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
  public targetAngle: number = 0;
  public weaponAngle: number = 0;
  private smoothWeaponAngle: number = 0;
  public turnSpeed: number = Math.PI * 1000;
  public modifiers: HeroModifier = new HeroModifier();

  private thrustTime: number = 0;

  protected bodyShape: ShapeType = {
    tag: 'circle',
    lockToWeapon: false,
  };
  protected innerBodyShape?: ShapeType;

  private fireTimer: number = 0;
  protected weapon?: Weapon;

  public constructor() {
    super();
    this.type = Tank.typeName;
    this.friction = 500;
    this.bounce = 0.3;

    this.boundingBox.width = 30;
    this.boundingBox.height = 30;

    this.lifeRegen = 1 / 40;

    this.setMaxLife(50);
    this.setLife(50);

    if (NetworkManager.isClient()) {
      this.streamEvents<FireEvent>('FireEvent')
        .filter(({data: {sourceID}}) => sourceID === this.id)
        .forEach(({data: {cannonIndex}}) => {
          this.cannons[cannonIndex].lastFired = EventManager.timeElapsed;
        });
    }
  }

  public override step(dt: number) {
    // Rotate towards targetAngle
    const tau = 2 * Math.PI;
    this.targetAngle = (this.targetAngle + tau) % tau;
    this.angle = (this.angle + tau) % tau;

    const diff = (this.targetAngle - this.angle + tau) % tau;

    if (Math.abs(diff) < this.turnSpeed * dt) {
      this.angle = this.targetAngle;
    } else {
      let dir = 1;
      if (diff > Math.PI) {
        dir = -1;
      }
      this.angle = (this.angle + dir * this.turnSpeed * dt + tau) % tau;
    }
    super.step(dt);

    if (this.shouldSmooth()) {
      this.weaponAngle = this.smoothAngle(
        this.weaponAngle,
        this.smoothWeaponAngle,
        dt * 2
      );
    }

    this.fireTimer = Math.max(0, this.fireTimer - dt);
  }

  public override calculateDamageIn(amount: number): number {
    if (amount === 0) {
      return 0;
    }
    const armor = this.modifiers.get('armor') - 1 + this.armor;
    const adjusted = (amount - armor) * (2 - this.modifiers.get('absorption'));
    return Math.max(1, adjusted);
  }

  protected override onDamageOut(amount: number, target: Unit) {
    super.onDamageOut(amount, target);
    const lifeSteal = this.modifiers.get('lifeSteal') - 1;
    const healAmount = lifeSteal * amount;
    if (healAmount > 0) {
      this.heal(healAmount);
    }
  }

  protected override onDamageIn(amount: number, source?: Unit) {
    super.onDamageIn(amount, source);

    if (!source) {
      return;
    }

    const reflect = this.modifiers.get('reflection') - 1;
    if (reflect <= 0) {
      return;
    }

    const reflectAmount = amount * reflect;
    source.damage(reflectAmount, this, true);
  }

  public override setThrusting(thrusting: number) {
    if (thrusting !== this.thrusting) {
      super.setThrusting(thrusting);
      this.thrustTime = EventManager.timeElapsed;
    }
  }

  protected getFireParameter(): number {
    return (this.fireTimer / FIRE_DURATION) * 0.2 + 1;
  }

  protected getThrustParameter(): number {
    const period = 0.5;

    const timeThrusting = EventManager.timeElapsed - this.thrustTime;
    let t = 0;
    if (this.thrusting) {
      const p = (timeThrusting % period) / period;
      t = Math.sin(p * Math.PI) / 2 + 0.5;
    }

    return t;
  }

  public override getLifeRegen(): number {
    return Math.max(super.getLifeRegen() * this.modifiers.get('lifeRegen'), 0);
  }

  public override getLifeRegenDelay(): number {
    return Math.max(
      super.getLifeRegenDelay() * this.modifiers.get('lifeRegenDelay'),
      0
    );
  }

  protected renderThruster(ctx: GraphicsContext) {
    const {width} = this.boundingBox;
    const radius = width / 2;

    // Create a pulsing shape behind cannon
    const scale = this.getThrustParameter();

    if (scale > 0) {
      GraphicsPipeline.pipe()
        .translate(-radius, 0)
        .scale(scale)
        .options({
          doFill: true,
          doStroke: false,
        })
        .alpha(0.5)
        .run(ctx, (ctx) => {
          ctx.regularPolygon(0, 0, 5, radius, this.getColor(), 0);
        });
    }
  }

  protected renderBodyShape(shape: ShapeType, ctx: GraphicsContext) {
    let {width} = this.boundingBox;
    width *= 1.1;
    const radius = (width / 2) * (shape.radius ?? 1);
    let rotation = 0;
    if (shape.lockToWeapon) {
      rotation = this.weaponAngle - this.angle;
    }
    if (shape.ignoreAngle) {
      rotation = this.angle;
    }

    GraphicsPipeline.pipe()
      .options({
        doFill: true,
        doStroke: true,
      })
      .rotate(rotation)
      .run(ctx, (ctx) => {
        if (shape.tag === 'circle') {
          ctx.ellipse(
            -radius,
            -radius,
            radius * 2,
            radius * 2,
            this.getColor()
          );
        } else if (shape.tag === 'polygon') {
          ctx.regularPolygon(
            0,
            0,
            shape.sides,
            radius,
            this.getColor(),
            shape.angle ?? 0
          );
        }
      });
  }

  protected renderBody(ctx: GraphicsContext) {
    this.renderBodyShape(this.bodyShape, ctx);
    if (this.innerBodyShape) {
      this.renderBodyShape(this.innerBodyShape, ctx);
    }
  }

  protected renderCannonShape(ctx: GraphicsContext, cannon: TankCannon) {
    const color = this.getColor();

    const {shape, lastFired} = cannon;
    const horizontalScale = getFireParameter(lastFired);
    const verticalScale = horizontalScale / 2 + 0.5;

    GraphicsPipeline.pipe()
      .options({
        doFill: true,
        doStroke: true,
      })
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

  public incrementCannonIndex() {
    this.cannonIndex = (this.cannonIndex + 1) % this.cannons.length;
  }

  protected renderCannon(ctx: GraphicsContext) {
    GraphicsPipeline.pipe()
      .rotate(this.weaponAngle - this.angle)
      .run(ctx, (ctx) => {
        Iterator.array(this.cannons).forEach(
          this.renderCannonShape.bind(this, ctx)
        );
      });
  }

  public override render(ctx: GraphicsContext) {
    GraphicsPipeline.pipe().run(ctx, (ctx) => {
      this.renderCannon(ctx);
      this.renderBody(ctx);
    });
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      cannons: this.cannons.map(({lastFired, shape, key}) => ({
        key,
        lastFired,
        shape: shape.serialize(),
      })),
      targetAngle: this.targetAngle,
      weaponAngle: this.weaponAngle,
      weapon: this.weapon?.serialize(),
      modifiers: this.modifiers.serialize(),
      armor: this.armor,
    };
  }

  public override deserialize(data: Data, setInitialized?: boolean) {
    super.deserialize(data, setInitialized);
    const {
      cannons,
      bodyShape,
      innerBodyShape,
      weapon,
      weaponAngle,
      targetAngle,
      modifiers,
      armor,
    } = data;

    if (modifiers) {
      this.modifiers.deserialize(modifiers);
      this.setMaxLife(this.getMaxLife());
      if (setInitialized) {
        this.setLife(this.getMaxLife());
      }
    }

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
        const {tag, sides, angle, lockToWeapon, ignoreAngle, radius} =
          bodyShape;
        this.bodyShape = {
          tag,
          sides,
          lockToWeapon,
          ignoreAngle,
          radius,
          angle: angle !== undefined ? (angle * Math.PI) / 180 : undefined,
        };
      } else {
        this.bodyShape = bodyShape;
      }
    }
    if (innerBodyShape) {
      // TODO Add type checking
      if (innerBodyShape.tag === 'polygon') {
        const {tag, sides, angle, lockToWeapon, ignoreAngle, radius} =
          innerBodyShape;
        this.innerBodyShape = {
          tag,
          sides,
          lockToWeapon,
          ignoreAngle,
          radius,
          angle: angle !== undefined ? (angle * Math.PI) / 180 : undefined,
        };
      } else {
        this.innerBodyShape = innerBodyShape;
      }
    }
    if (weapon) {
      const {type} = weapon;
      if (typeof weapon === 'string') {
        if (this.weapon?.type !== weapon) {
          const newWeapon = WeaponManager.instantiate(weapon);
          this.setWeapon(newWeapon);
        }
      } else if (type && this.weapon?.type !== type) {
        const newWeapon = WeaponManager.instantiate(type);
        if (newWeapon) {
          newWeapon.deserialize(weapon);
          this.setWeapon(newWeapon);
        }
      } else {
        this.weapon?.deserialize(weapon);
      }
    }

    if (typeof weaponAngle === 'number') {
      if (this.shouldSmooth()) {
        this.smoothWeaponAngle = weaponAngle;
      } else {
        this.weaponAngle = weaponAngle;
      }
    }

    if (typeof targetAngle === 'number') {
      this.targetAngle = targetAngle;
    }
    if (typeof armor === 'number') {
      this.armor = armor;
    }
  }

  public override cleanup() {
    this.weapon?.cleanup();
    this.effectCounts.clear();
    super.cleanup();
  }

  public getCannonTip(): Vector {
    const cannon = this.cannons[this.cannonIndex];
    cannon?.shape?.getTip(
      this.position.x,
      this.position.y,
      this.weaponAngle,
      this.vectorBuffer
    );
    return this.vectorBuffer;
  }

  public getCannonAngle(): number {
    return this.cannons[this.cannonIndex]?.shape?.angle ?? 0;
  }

  public fire(angle: number) {
    this.weapon?.fireInternal(this, angle, this.modifiers);
  }

  public setWeapon(weapon?: Weapon | string) {
    let actualWeapon: Weapon | undefined;
    if (typeof weapon === 'string') {
      actualWeapon = WeaponManager.instantiate(weapon);
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

  public override getSpeed(): number {
    return Math.max(super.getSpeed() * this.modifiers.get('speed'), 0);
  }

  public override getMass(): number {
    return Math.max(super.getMass() * this.modifiers.get('mass'), 0);
  }

  public override getFriction(): number {
    return Math.max(super.getFriction() * this.modifiers.get('friction'), 0);
  }

  public override setMaxLife(maxLife: number) {
    let life = maxLife;
    if (NetworkManager.isServer() && this.modifiers) {
      life = Math.round(this.modifiers.get('life') * life);
    }
    super.setMaxLife(life);
  }

  private getBaseMaxLife() {
    const maxLife = this.getMaxLife();
    const lifeMod = this.modifiers.get('life');
    if (lifeMod < 0) {
      return 0;
    }
    return Math.round(maxLife / lifeMod);
  }

  public composeModifiers(modifier: HeroModifier, isInverted: boolean = false) {
    const oldMaxLife = this.getBaseMaxLife();
    this.modifiers.compose(modifier, isInverted);
    if (modifier.has('life')) {
      this.setMaxLife(oldMaxLife);
    }
  }

  protected override calculateDamageOut(amount: number): number {
    return amount * this.modifiers.get('damage');
  }
}
