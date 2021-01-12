import {Projectile, Entity, WorldManager} from 'core/entity';
import {DirectionVector} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {NetworkManager} from 'core/net';
import {Data} from 'core/serialize';

export class HomingProjectile extends Projectile {
  public static typeName: string = 'HomingProjectile';

  public velocity: DirectionVector = new DirectionVector();
  public maxSpeed: number = 1;
  public turnSpeed: number = 1;
  public target?: Entity;

  public constructor() {
    super();
    this.type = HomingProjectile.typeName;
    this.friction = 0;
  }

  public step(dt: number): void {
    if (NetworkManager.isServer()) {
      if (this.target) {
        this.vectorBuffer.set(this.target.position);
        this.vectorBuffer.add(this.position, -1);
        this.vectorBuffer.magnitude = this.turnSpeed;
        this.velocity.add(this.vectorBuffer);
      }

      if (this.velocity.magnitudeSquared > this.maxSpeed * this.maxSpeed) {
        this.velocity.magnitude = this.maxSpeed;
      }
    }

    super.step(dt);
    this.angle = this.velocity.direction;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      maxSpeed: this.maxSpeed,
      turnSpeed: this.turnSpeed,
      targetID: this.target?.id,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const {maxSpeed, turnSpeed, targetID} = data;

    if (typeof maxSpeed === 'number') {
      this.maxSpeed = maxSpeed;
    }

    if (typeof turnSpeed === 'number') {
      this.turnSpeed = turnSpeed;
    }

    if (typeof targetID === 'number') {
      this.target = WorldManager.getEntity(targetID);
    }
  }
}
