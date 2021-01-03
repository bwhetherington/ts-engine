import {Tank, BaseHero} from 'core/entity';

export abstract class Controller {
  protected hero?: BaseHero;

  public attach(tank: BaseHero): void {
    this.hero = tank;
  }

  public detach(): void {
    this.hero = undefined;
  }

  public step(dt: number): void {}
}
