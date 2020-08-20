import { Tank, Hero } from 'core/entity';

export abstract class Controller {
  protected hero?: Hero;

  public attach(tank: Hero): void {
    this.hero = tank;
  }

  public detach(): void {
    this.hero = undefined;
  }

  public step(dt: number): void {}
}
