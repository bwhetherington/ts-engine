import {EventManager} from 'core/event';
import {LogManager} from 'core/log';
import {
  KEY_MAP,
  KeyEvent,
  KeyAction,
  BUTTON_MAP,
  MouseAction,
  MouseEvent,
  Key,
} from 'core/input';
import {CameraManager} from 'core/graphics';
import {NetworkManager} from 'core/net';

const log = LogManager.forFile(__filename);

function initializeKeyStates(): Array<boolean> {
  const obj = [];

  for (let i = 0; i < Object.keys(Key).length; i++) {
    obj.push(false);
  }

  return obj;
}

export class InputManager {
  private element?: HTMLElement;
  private keyStates: Array<boolean> = initializeKeyStates();

  public constructor() {}

  public initialize(element: HTMLElement): void {
    this.element = element;
    this.element?.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    this.element?.addEventListener('mousedown', (event) => {
      const {clientX, clientY} = event;
      const {x, y} = CameraManager.toWorldSpace(clientX, clientY);
      const button = BUTTON_MAP[event.button];
      if (button !== undefined) {
        const mouseEvent = {
          type: 'MouseEvent',
          data: {
            action: MouseAction.ButtonDown,
            button,
            x,
            y,
          },
        };
        NetworkManager.sendEvent<MouseEvent>(mouseEvent);
        EventManager.emit(mouseEvent);
      } else {
        log.warn('unrecognized button: ' + event.button);
      }
    });
    this.element?.addEventListener('mouseup', (event) => {
      const {clientX, clientY} = event;
      const {x, y} = CameraManager.toWorldSpace(clientX, clientY);
      const button = BUTTON_MAP[event.button];
      if (button !== undefined) {
        const mouseEvent = {
          type: 'MouseEvent',
          data: <MouseEvent>{
            action: MouseAction.ButtonUp,
            button,
            x,
            y,
          },
        };
        EventManager.emit(mouseEvent);
        NetworkManager.send(mouseEvent);
      } else {
        log.warn('unrecognized button: ' + event.button);
      }
    });
    this.element?.addEventListener('mousemove', (event) => {
      const {clientX, clientY} = event;
      const {x, y} = CameraManager.toWorldSpace(clientX, clientY);
      const mouseEvent = {
        type: 'MouseEvent',
        data: <MouseEvent>{
          action: MouseAction.Move,
          x,
          y,
        },
      };
      EventManager.emit(mouseEvent);
      NetworkManager.send(mouseEvent);
    });
    this.element?.addEventListener('keydown', (event) => {
      const key = KEY_MAP[event.code];
      if (key !== undefined) {
        if (!this.keyStates[key]) {
          this.keyStates[key] = true;
          const keyEvent = {
            type: 'KeyEvent',
            data: <KeyEvent>{
              action: KeyAction.KeyDown,
              key,
            },
          };
          EventManager.emit(keyEvent);
          NetworkManager.send(keyEvent);
        }
      } else {
        log.warn('unrecognized key: ' + event.code);
      }
    });
    this.element?.addEventListener('keyup', (event) => {
      const key = KEY_MAP[event.code];
      if (key !== undefined) {
        if (this.keyStates[key]) {
          this.keyStates[key] = false;
          const keyEvent = {
            type: 'KeyEvent',
            data: <KeyEvent>{
              action: KeyAction.KeyUp,
              key,
            },
          };
          EventManager.emit(keyEvent);
          NetworkManager.send(keyEvent);
        }
      } else {
        log.warn('unrecognized key: ' + event.code);
      }
    });
    log.debug('InputManager initialized');
  }

  public reset(): void {
    for (let key = 0; key < this.keyStates.length; key++) {
      if (this.keyStates[key]) {
        EventManager.emit<KeyEvent>({
          type: 'KeyEvent',
          data: {
            action: KeyAction.KeyUp,
            key
          }
        });
      }
      this.keyStates[key] = false;
    }
  }
}
