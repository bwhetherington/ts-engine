import { Component } from 'client/components/util';
import { EM, StepEvent, Event } from 'core/event';
import { SizedQueue } from 'core/util';
import template from 'client/components/chat/template.html';
import { LM } from 'core/log';
import {
  TextColor,
  TextStyle,
  TextComponent,
  TextCommandEvent,
} from 'core/chat';
import { Color, rgb, toCss } from 'core/graphics';
import { TextMessageInEvent, TextMessageOutEvent } from 'core/chat';
import { NM } from 'core/net';

const COLOR_MAPPING: { [color in TextColor]: Color } = {
  none: rgb(1, 1, 1),
  red: rgb(0.9, 0.4, 0.4),
  orange: rgb(0.9, 0.6, 0.3),
  yellow: rgb(0.9, 0.8, 0.3),
  green: rgb(0.3, 0.6, 0.3),
  aqua: rgb(0.3, 0.8, 1),
  blue: rgb(0.5, 0.5, 1),
  purple: rgb(0.9, 0.3, 0.9),
};

export class ChatComponent extends Component {
  public static componentName: string = 'chat-component';

  private input?: HTMLInputElement;
  private messagesContainer?: HTMLElement;
  private messagesQueue: SizedQueue<Element> = new SizedQueue(100);

  constructor() {
    super(template);

    const messages = this.queryChild('#messages');
    if (messages) {
      this.messagesContainer = messages;
    }

    const input = this.queryChild('#chat-input');
    if (input instanceof HTMLInputElement) {
      this.input = input;
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

    EM.addListener(
      'TextMessageOutEvent',
      (event: Event<TextMessageOutEvent>) => {
        const element = this.renderComponents(event.data.components);
        this.addMessage(element);
      }
    );
  }

  private handleMessage(message: string): void {
    if (message.startsWith('/')) {
      // Send command
      const argv = message.slice(1).split(/\W+/);
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
        NM.send(event);
      } else {
        LM.error('expected command');
      }
    } else {
      // Send message
      const outEvent = {
        type: 'TextMessageInEvent',
        data: <TextMessageInEvent>{
          content: message,
        },
      };
      NM.send(outEvent);
    }
  }

  private addMessage(message: HTMLElement): void {
    const removed = this.messagesQueue.enqueue(message);
    console.log(this.messagesQueue);
    if (removed) {
      this.messagesContainer?.removeChild(removed);
    }
    this.messagesContainer?.appendChild(message);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private renderComponent(component: string | TextComponent): HTMLElement {
    const span = document.createElement('span');
    if (typeof component === 'string') {
      span.innerText = component;
    } else {
      component;
      span.innerText = component.content;

      if (component.style?.color) {
        span.style.color = toCss(COLOR_MAPPING[component.style.color]);
      }

      if (component.style?.styles?.includes('bold')) {
        span.style.fontWeight = 'bold';
      }
    }
    return span;
  }

  private renderComponents(
    components: (string | TextComponent)[]
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
