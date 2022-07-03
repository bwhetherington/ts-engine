import {
  EventManager,
  BatchEvent,
  GameEvent,
  makeEvent,
} from '@/core/event';
import {LogManager} from '@/core/log';
import {
  KEY_MAP,
  KeyEvent,
  KeyAction,
  BUTTON_MAP,
  MouseAction,
  MouseEvent,
  Key,
  MouseButton,
} from '@/core/input';
import {CameraManager} from '@/core/graphics';
import {NetworkManager} from '@/core/net';
import {Iterator} from '@/core/iterator';
import {Vector} from '@/core/geometry';

const log = LogManager.forFile(__filename);

function initializeKeyStates(): boolean[] {
  const obj: boolean[] = [];

  Iterator.keys(Key).forEach(() => {
    obj.push(false);
  });

  return obj;
}

function initializeButtonStates(): boolean[] {
  const obj = [];

  for (let i = 0; i < Object.keys(MouseButton).length; i++) {
    obj.push(false);
  }

  return obj;
}

export class InputManager {
  private element?: HTMLElement;
  private keyStates: boolean[] = initializeKeyStates();
  private mouseButtonStates: boolean[] = initializeButtonStates();
  private mousePosition: Vector = new Vector(0, 0);

  public constructor() {}

  public initialize(element: HTMLElement) {
    this.element = element;
    this.element?.addEventListener('blur', () => {
      this.reset();
    });
    this.element?.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    this.element?.addEventListener('mousedown', (event) => {
      this.updateMousePosition(event);
      this.buttonDown(event.button);
    });
    this.element?.addEventListener('mouseup', (event) => {
      this.updateMousePosition(event);
      this.buttonUp(event.button);
    });
    this.element?.addEventListener('mousemove', (event) => {
      this.updateMousePosition(event);
      const mouseEvent = makeEvent(MouseEvent, {
        action: MouseAction.Move,
        x: this.mousePosition.x,
        y: this.mousePosition.y,
      });
      EventManager.emit(mouseEvent);
      NetworkManager.sendEvent(mouseEvent);
    });
    this.element?.addEventListener('keydown', (event) => {
      this.keyDown(event.code);
    });
    this.element?.addEventListener('keyup', (event) => {
      this.keyUp(event.code);
    });
    log.debug('InputManager initialized');
  }

  public updateMousePosition(event: globalThis.MouseEvent) {
    const {clientX, clientY} = event;
    const {x, y} = CameraManager.toWorldSpace(clientX, clientY);
    this.mousePosition.setXY(x, y);
  }

  public keyDown(code: string) {
    const key = KEY_MAP[code];
    if (key !== undefined) {
      if (!this.keyStates[key]) {
        this.keyStates[key] = true;
        const keyEvent = makeEvent(KeyEvent, {
          action: KeyAction.KeyDown,
          key,
        });
        EventManager.emit(keyEvent);
        NetworkManager.sendEvent(keyEvent);
      }
    } else {
      log.warn('unrecognized key: ' + code);
    }
  }

  public keyUp(code: string) {
    const key = KEY_MAP[code];
    if (key !== undefined) {
      if (this.keyStates[key]) {
        this.keyStates[key] = false;
        const keyEvent = makeEvent(KeyEvent, {
          action: KeyAction.KeyUp,
          key,
        });
        EventManager.emit(keyEvent);
        NetworkManager.sendEvent(keyEvent);
      }
    } else {
      log.warn('unrecognized key: ' + code);
    }
  }

  public buttonUp(code: number) {
    const button = BUTTON_MAP[code];
    if (button !== undefined) {
      if (this.mouseButtonStates[button]) {
        this.mouseButtonStates[button] = false;
        const buttonEvent = makeEvent(MouseEvent, {
          action: MouseAction.ButtonUp,
          button,
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        });
        EventManager.emit(buttonEvent);
        NetworkManager.sendEvent(buttonEvent);
      }
    } else {
      log.warn(`unrecognized button: ${code}`);
    }
  }

  public buttonDown(code: number) {
    const button = BUTTON_MAP[code];
    if (button !== undefined) {
      if (!this.mouseButtonStates[button]) {
        this.mouseButtonStates[button] = true;
        const buttonEvent = makeEvent(MouseEvent, {
          action: MouseAction.ButtonDown,
          button,
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        });
        EventManager.emit(buttonEvent);
        NetworkManager.sendEvent(buttonEvent);
      }
    } else {
      log.warn(`unrecognized button: ${code}`);
    }
  }

  public reset() {
    const keyUpEvents: GameEvent[] = Iterator.array(this.keyStates)
      .enumerate()
      .map(([_state, key]) => key)
      .map((key) =>
        makeEvent(KeyEvent, {
          action: KeyAction.KeyUp,
          key,
        })
      )
      .toArray();
    const buttonUpEvents: GameEvent[] = Iterator.array(this.mouseButtonStates)
      .enumerate()
      .map(([_state, button]) => button)
      .map((button) =>
        makeEvent(MouseEvent, {
          action: MouseAction.ButtonUp,
          button,
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        })
      )
      .toArray();
    const batchEvent = makeEvent(BatchEvent, {
      events: [...keyUpEvents, ...buttonUpEvents],
    });
    EventManager.emit(batchEvent);
    NetworkManager.sendEvent(batchEvent);
  }
}
