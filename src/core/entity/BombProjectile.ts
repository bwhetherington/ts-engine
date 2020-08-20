import { Projectile, Unit, WorldManager, Explosion } from 'core/entity';
import { Rectangle, Vector } from 'core/geometry';
import { rgba } from 'core/graphics';

const RADIUS = 50;

export class BombProjectile extends Projectile {
  public static typeName = 'BombProjectile';

  public constructor() {
    super();
    this.type = BombProjectile.typeName;
    this.setOriginalColor(rgba(0.8, 0.1, 0.1, 0.5));
    this.boundingBox.width = 30;
    this.boundingBox.height = 30;
  }

  public hit(unit?: Unit): void {
    const { damage } = this;
    this.damage = 0;
    super.hit(unit);
    this.damage = damage;

    const rect = new Rectangle(RADIUS * 2, RADIUS * 2);
    rect.centerX = this.position.x;
    rect.centerY = this.position.y;

    const vec = new Vector();

    WorldManager.query(rect)
      .filterType((entity): entity is Unit => entity instanceof Unit)
      .filter((unit) => unit !== this.parent)
      .filter((unit) => unit.boundingBox.intersects(rect))
      .filter((unit) => unit.position.distanceTo(this.position) <= RADIUS)
      .forEach((unit) => {
        unit.damage(this.damage, this.parent);
        vec.set(unit.position);
        vec.add(this.position, -1);
        vec.normalize();
        unit.applyForce(vec, 500);
      });
  }

  protected explode(): void {
    const explosion = WorldManager.spawn(Explosion, this.position);
    explosion.radius = RADIUS;
    explosion.setColor(this.getColor());
  }
}
