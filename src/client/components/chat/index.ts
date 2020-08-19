import { Component } from 'client/components/util';
import { EventManager, StepEvent, Event } from 'core/event';
import { SizedQueue } from 'core/util';
import { LogManager } from 'core/log';
import {
  TextColor,
  TextComponent,
  TextCommandEvent,
  renderError,
} from 'core/chat';
import { Color, rgb, toCss, rgba } from 'core/graphics';
import { TextMessageInEvent, TextMessageOutEvent } from 'core/chat';
import { NetworkManager, DisconnectEvent } from 'core/net';
import template from 'client/components/chat/template.html';
import { iterator } from 'core/iterator';
import { KeyEvent, KeyAction, Key } from 'core/input';

const log = LogManager.forFile(__filename);

const COLOR_MAPPING: { [color in TextColor]: Color } = {
  none: rgb(1, 1, 1),
  red: rgb(1, 0.4, 0.4),
  orange: rgb(0.9, 0.6, 0.3),
  yellow: rgba(1, 1, 1, 0.75),
  green: rgb(0.3, 0.6, 0.3),
  aqua: rgb(0.3, 0.8, 1),
  blue: rgb(0.5, 0.5, 1),
  purple: rgb(0.9, 0.3, 0.9),
};

const SHOW_TIME = 5;

function splitWords(str: string): string[] {
  const words = [];
  let word = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      if (word.length > 0) {
        words.push(word);
        word = '';
      }

      let j = i + 1;
      for (; j < str.length; j++) {
        if (str[j] === '"') {
          words.push(word);
          word = '';
          break;
        }
        word += str[j];
      }
      i = j;
    } else if (/\s/.test(ch)) {
      if (word.length > 0) {
        words.push(word);
        word = '';
      }
    } else {
      word += ch;
    }
  }

  if (word.length > 0) {
    words.push(word);
  }

  return words;
}

export class ChatComponent extends Component {
  public static componentName: string = 'chat-component';

  private container?: HTMLElement;
  private input?: HTMLInputElement;
  private messagesContainer?: HTMLElement;
  private messagesQueue: SizedQueue<Element> = new SizedQueue(100);
  private timer: number = 0;
  private isShown: boolean = false;
  private isFocused: boolean = false;

  constructor() {
    super(template);

    this.container = this.queryChild('#container');

    const messages = this.queryChild('#messages');
    if (messages) {
      this.messagesContainer = messages;
    }

    const input = this.queryChild('#chat-input');
    if (input instanceof HTMLInputElement) {
      this.input = input;
      this.input.addEventListener('focus', () => {
        this.isFocused = true;
        this.show();
      });
      this.input.addEventListener('blur', () => {
        this.isFocused = false;
        if (this.timer === 0) {
          this.hide();
        }
      });
    }

    const form = this.queryChild('#chat-form');
    if (form instanceof HTMLFormElement) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (this.input) {
          const content = this.input.value;
          this.input.value = '';
          this.handleMessage(content);
        }
      });
    }

    EventManager.addListener<DisconnectEvent>('DisconnectEvent', (event) => {
      const components = renderError('Disconnected from server');
      const element = this.renderComponents(components);
      this.addMessage(element);
    });

    EventManager.addListener<TextMessageOutEvent>(
      'TextMessageOutEvent',
      (event) => {
        const { components } = event.data;
        const element = this.renderComponents(components);
        this.addMessage(element);
      }
    );

    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      this.timer = Math.max(0, this.timer - event.data.dt);
      if (this.timer === 0) {
        this.hide();
      }
    });

    EventManager.addListener<KeyEvent>('KeyEvent', (event) => {
      const { action, key } = event.data;
      if (action === KeyAction.KeyDown && key === Key.Enter) {
        this.input?.focus();
      }
    });
  }

  private show(): void {
    if (this.container && !this.isShown) {
      this.container.style.visibility = 'visible';
      this.container.style.pointerEvents = 'auto';
      this.isShown = true;
    }
  }

  private hide(): void {
    if (this.container && this.isShown && !this.isFocused) {
      this.container.style.visibility = 'hidden';
      this.container.style.pointerEvents = 'none';
      this.isShown = false;
    }
  }

  private handleMessage(message: string): void {
    message = message.trim();
    if (message.startsWith('/')) {
      // Send command
      const argv = iterator(splitWords(message.slice(1)))
        .map((word) => word.trim())
        .filter((word) => word.length > 0)
        .toArray();
      if (argv.length > 0) {
        const command = argv[0];
        const args = argv.slice(1);
        const event = {
          type: 'TextCommandEvent',
          data: <TextCommandEvent>{
            command,
            args,
          },
        };
        NetworkManager.send(event);
      } else {
        log.error('expected command');
      }
    } else if (message.length > 0) {
      // Send message
      const outEvent = {
        type: 'TextMessageInEvent',
        data: <TextMessageInEvent>{
          content: message,
        },
      };
      NetworkManager.send(outEvent);
    }
  }

  private addMessage(message: HTMLElement): void {
    const removed = this.messagesQueue.enqueue(message);
    if (removed) {
      this.messagesContainer?.removeChild(removed);
    }
    this.messagesContainer?.appendChild(message);
    this.scrollToBottom();
    this.timer = SHOW_TIME;
    this.show();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private renderComponent(
    component: string | null | TextComponent
  ): HTMLElement {
    let element = document.createElement('span');
    if (component === null) {
      element = document.createElement('br');
    } else if (typeof component === 'string') {
      element.innerText = component;
    } else {
      component;
      element.innerText = component.content;

      if (component.style?.color) {
        element.style.color = toCss(COLOR_MAPPING[component.style.color]);
      }

      if (component.style?.styles?.includes('bold')) {
        element.style.fontWeight = 'bold';
      }
    }
    return element;
  }

  private renderComponents(
    components: (string | null | TextComponent)[]
  ): HTMLElement {
    const element = document.createElement('div');
    element.className = 'message';

    for (const component of components) {
      const child = this.renderComponent(component);
      element.appendChild(child);
    }

    return element;
  }
}
