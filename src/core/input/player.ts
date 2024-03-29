import {Controller, KeyEvent, MouseAction, MouseEvent} from '@/core/input';
import {BaseHero} from '@/core/entity';
import {UUID} from '@/core/uuid';
import {NetworkManager} from '@/core/net';
import {Vector} from '@/core/geometry';

export class PlayerController extends Controller {
  private mouseDown: boolean = false;

  private keyListenerId?: UUID;
  private mouseListenerId?: UUID;

  public attach(hero: BaseHero) {
    super.attach(hero);

    this.mouseListenerId = hero.addListener(MouseEvent, (event) => {
      if (hero.isEventSubject(event)) {
        const {action, x, y} = event.data;
        if (action === MouseAction.Move) {
          // Subtract our position from mouse position
          Vector.BUFFER.setXY(x, y);
          Vector.BUFFER.add(hero.position, -1);
          hero.angle = Vector.BUFFER.angle;
        } else if (action === MouseAction.ButtonDown) {
          this.mouseDown = true;
        } else if (action === MouseAction.ButtonUp) {
          this.mouseDown = false;
        }
      }
    });
  }

  public detach() {
    if (this.mouseListenerId) {
      this.hero?.removeListener(MouseEvent, this.mouseListenerId);
    }
    if (this.keyListenerId) {
      this.hero?.removeListener(KeyEvent, this.keyListenerId);
    }
    super.detach();
  }

  public step(_: number) {
    if (this.mouseDown && NetworkManager.isServer()) {
      this.hero?.fire(this.hero?.angle);
    }
  }
}
