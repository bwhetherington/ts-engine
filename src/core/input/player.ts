import {
  Controller,
  MouseAction,
  MouseEvent,
  KeyAction,
  KeyEvent,
  MOVEMENT_DIRECTION_MAP,
} from 'core/input';
import {BaseHero} from 'core/entity';
import {UUID} from 'core/uuid';
import {NetworkManager} from 'core/net';

export class PlayerController extends Controller {
  private mouseDown: boolean = false;
  private keyListenerID?: UUID;
  private mouseListenerID?: UUID;

  public attach(hero: BaseHero): void {
    super.attach(hero);

    this.mouseListenerID = hero.addListener<MouseEvent>(
      'MouseEvent',
      (event) => {
        if (hero.isEventSubject(event)) {
          const {action, x, y} = event.data;
          if (action === MouseAction.Move) {
            // Subtract our position from mouse position
            hero.vectorBuffer.setXY(x, y);
            hero.vectorBuffer.add(hero.position, -1);
            hero.angle = hero.vectorBuffer.angle;
          } else if (action === MouseAction.ButtonDown) {
            this.mouseDown = true;
          } else if (action === MouseAction.ButtonUp) {
            this.mouseDown = false;
          }
        }
      }
    );

    this.keyListenerID = hero.addListener<KeyEvent>('KeyEvent', (event) => {
      if (hero.isEventSubject(event)) {
        const {action, key} = event.data;
        const state = action === KeyAction.KeyDown;
        const direction = MOVEMENT_DIRECTION_MAP[key];
        if (direction !== undefined) {
          hero.setMovement(direction, state);
        }
      }
    });
  }

  public detach(): void {
    if (this.mouseListenerID) {
      this.hero?.removeListener('MouseEvent', this.mouseListenerID);
    }
    if (this.keyListenerID) {
      this.hero?.removeListener('KeyEvent', this.keyListenerID);
    }
    super.detach();
  }

  public step(_: number): void {
    if (this.mouseDown && NetworkManager.isServer()) {
      this.hero?.fire(this.hero?.angle);
    }
  }
}
