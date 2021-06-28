import {AssetManager} from 'core/assets';
import {StepEvent} from 'core/event';
import {NetworkManager} from 'core/net';
import {Data} from 'core/serialize';
import {Unit} from './Unit';

type Direction = 'up' | 'down' | 'left' | 'right';

export class Character extends Unit {
  private direction: Direction = 'right';

  constructor() {
    super();

    if (NetworkManager.isClient()) {
      AssetManager.loadSprite('sprites/fighter.json').then(
        (sprite) => (this.sprite = sprite)
      );
    }
  }

  public step(dt: number): void {
    super.step(dt);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      direction: this.direction,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {direction} = data;
    this.direction = direction;
  }
}
