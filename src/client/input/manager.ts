import {EventManager, Event, BatchEvent, GameEvent} from '@/core/event';
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
      const mouseEvent = {
        type: 'MouseEvent',
        data: {
          action: MouseAction.Move,
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        },
      };
      EventManager.emit<MouseEvent>(mouseEvent);
      NetworkManager.sendEvent<MouseEvent>(mouseEvent);
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
        const keyEvent = {
          type: 'KeyEvent',
          data: {
            action: KeyAction.KeyDown,
            key,
          },
        };
        EventManager.emit<KeyEvent>(keyEvent);
        NetworkManager.sendEvent<KeyEvent>(keyEvent);
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
        const keyEvent = {
          type: 'KeyEvent',
          data: {
            action: KeyAction.KeyUp,
            key,
          },
        };
        EventManager.emit<KeyEvent>(keyEvent);
        NetworkManager.sendEvent<KeyEvent>(keyEvent);
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
        const buttonEvent = {
          type: 'MouseEvent',
          data: {
            action: MouseAction.ButtonUp,
            button,
            x: this.mousePosition.x,
            y: this.mousePosition.y,
          },
        };
        EventManager.emit<MouseEvent>(buttonEvent);
        NetworkManager.sendEvent<MouseEvent>(buttonEvent);
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
        const buttonEvent = {
          type: 'MouseEvent',
          data: {
            action: MouseAction.ButtonDown,
            button,
            x: this.mousePosition.x,
            y: this.mousePosition.y,
          },
        };
        EventManager.emit<MouseEvent>(buttonEvent);
        NetworkManager.sendEvent<MouseEvent>(buttonEvent);
      }
    } else {
      log.warn(`unrecognized button: ${code}`);
    }
  }

  public reset() {
    const keyUpEvents: GameEvent[] = Iterator.array(this.keyStates)
      .enumerate()
      .map(([_state, key]) => key)
      .map<Event<KeyEvent>>((key) => ({
        type: 'KeyEvent',
        data: {
          action: KeyAction.KeyUp,
          key,
        },
      }))
      .toArray();
    const buttonUpEvents: GameEvent[] = Iterator.array(this.mouseButtonStates)
      .enumerate()
      .map(([_state, button]) => button)
      .map<Event<MouseEvent>>((button) => ({
        type: 'MouseEvent',
        data: {
          action: MouseAction.ButtonUp,
          button,
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        },
      }))
      .toArray();
    const event: Event<BatchEvent> = {
      type: 'BatchEvent',
      data: {
        events: [...keyUpEvents, ...buttonUpEvents],
      },
    };
    EventManager.emit(event);
    NetworkManager.sendEvent(event);
  }
}
