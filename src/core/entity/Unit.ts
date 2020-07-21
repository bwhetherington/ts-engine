import { Entity } from 'core/entity';
import { Data } from 'core/serialize';

export class Unit extends Entity {
  private maxLife: number = 100;
  private life: number = 100;

  public constructor() {
    super();
    this.type = Unit.typeName;
  }

  public getLife(): number {
    return this.life;
  }

  public setLife(life: number): void {
    this.life = Math.min(this.maxLife, life);
  }

  public getMaxLife(): number {
    return this.maxLife;
  }

  public setMaxLife(life: number): void {
    this.maxLife = life;
    this.setLife(this.life);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      life: this.life,
      maxLife: this.maxLife,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { life, maxLife } = data;
    if (typeof maxLife === 'number') {
      this.setMaxLife(maxLife);
    }
    if (typeof life === 'number') {
      this.setLife(life);
    }
  }
}
