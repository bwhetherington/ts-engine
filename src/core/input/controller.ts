import {Tank, BaseHero} from 'core/entity';

export abstract class Controller {
  protected hero?: BaseHero;

  public attach(tank: BaseHero) {
    this.hero = tank;
  }

  public detach() {
    this.hero = undefined;
  }

  public step(dt: number) {}
}
