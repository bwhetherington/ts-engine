import { Component } from 'client/components/util';
import { EM, StepEvent } from 'core/event';
import { SizedQueue } from 'core/util';

function makeMessage(content: string): Element {
  const element = document.createElement('div');
  element.innerText = content;
  return element;
}

export class ChatComponent extends Component {
  private messagesContainer?: Element;
  private messagesQueue: SizedQueue<Element> = new SizedQueue(10);

  public static register() {
    window.customElements.define('chat-component', ChatComponent);
  }

  constructor() {
    super('chat-template');

    console.log(this.id);

    const messages = this.queryChild('.messages');

    console.log(messages);

    if (messages) {
      this.messagesContainer = messages;
    }

    EM.addListener('StepEvent', (event: StepEvent) => {
      const messageElement = makeMessage('hello world ' + event.dt);
      const removed = this.messagesQueue.enqueue(messageElement);
      if (removed) {
        this.messagesContainer?.removeChild(removed);
      }
      this.messagesContainer?.appendChild(messageElement);

      // this.messagesContainer?.appendChild(makeMessage('hello world ' + event.dt));
    });
  }
}