import { EM } from 'core/event';
import { LM as InternalLogger } from 'core/log';
import {
  KEY_MAP,
  KeyEvent,
  KeyAction,
  BUTTON_MAP,
  MouseAction,
  MouseEvent,
  Key,
} from 'core/input';
import { CM } from 'core/graphics';
import { NM } from 'core/net';

const LM = InternalLogger.forFile(__filename);

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
      const { clientX, clientY } = event;
      const { x, y } = CM.translateMouse(clientX, clientY);
      const button = BUTTON_MAP[event.button];
      if (button !== undefined) {
        const mouseEvent = {
          type: 'MouseEvent',
          data: <MouseEvent>{
            action: MouseAction.ButtonDown,
            button,
            x,
            y,
          },
        };
        NM.send(mouseEvent);
        EM.emit(mouseEvent);
      } else {
        LM.warn('unrecognized button: ' + event.button);
      }
    });
    this.element?.addEventListener('mouseup', (event) => {
      const { clientX, clientY } = event;
      const { x, y } = CM.translateMouse(clientX, clientY);
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
        EM.emit(mouseEvent);
        NM.send(mouseEvent);
      } else {
        LM.warn('unrecognized button: ' + event.button);
      }
    });
    this.element?.addEventListener('mousemove', (event) => {
      const { clientX, clientY } = event;
      const { x, y } = CM.translateMouse(clientX, clientY);
      const mouseEvent = {
        type: 'MouseEvent',
        data: <MouseEvent>{
          action: MouseAction.Move,
          x,
          y,
        },
      };
      EM.emit(mouseEvent);
      NM.send(mouseEvent);
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
          EM.emit(keyEvent);
          NM.send(keyEvent);
        }
      } else {
        LM.warn('unrecognized key: ' + event.code);
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
          EM.emit(keyEvent);
          NM.send(keyEvent);
        }
      } else {
        LM.warn('unrecognized key: ' + event.code);
      }
    });
    LM.debug('InputManager initialized');

    // EM.addListener<KeyEvent>('KeyEvent', (event) => {
    //   const { action, key } = event.data;
    //   LM.info(`action: ${action}, key: ${key}`);
    // });

    // EM.addListener<MouseEvent>('MouseEvent', (event) => {
    //   const { action, button, x, y } = event.data;
    //   LM.info(`action: ${action}, x: ${x}, y: ${y}, button: ${button}`);
    // });
  }
}
