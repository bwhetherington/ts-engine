import { Component } from 'client/components/util';
import { EM, StepEvent } from 'core/event';
import { SizedQueue } from 'core/util';
import template from 'client/components/chat/template.html';
import { LM } from 'core/log';

function makeMessage(message: string): HTMLElement {
  const element = document.createElement('div');

  const author = document.createElement('span');
  author.className = 'author';
  author.innerText = '<Ben>';

  const content = document.createElement('span');
  content.className = 'content';
  content.innerText = ' ' + message;

  element.append(author, content);
  return element;
}

export interface ChatSendEvent {
  message: string;
}

export class ChatComponent extends Component {
  public static componentName: string = 'chat-component';

  private form?: HTMLFormElement;
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
      this.form = form;
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (this.input) {
          const message = this.input.value;
          this.input.value = '';
          const data: ChatSendEvent = {
            message,
          };
          EM.emit({ type: 'ChatSendEvent', data });
        }
      });
    }

    EM.addListener<ChatSendEvent>('ChatSendEvent', (event) => {
      console.log(event);
      const element = makeMessage(event.message);
      this.addMessage(element);
    });
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
}
