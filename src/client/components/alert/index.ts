import { Component } from 'client/components';
import template from 'client/components/alert/template.html';
import {
  FormItem,
  Form,
  FormSubmitEvent,
  Entry,
  FormShowEvent,
  FormValidatedEvent,
} from 'core/form';
import { EventManager } from 'core/event';
import { removeChildren } from 'client/components';

export class AlertComponent extends Component {
  public static componentName: string = 'alert-component';

  private container?: HTMLElement;
  private header?: HTMLElement;
  private body?: HTMLElement;

  private data: Record<string, Entry> = {};

  public constructor() {
    super(template);

    this.container = this.queryChild('.container');
    this.header = this.queryChild('#header');
    this.body = this.queryChild('#body');

    this.queryChild('#close')?.addEventListener('click', () => {
      this.hide();
    });

    EventManager.addListener<FormShowEvent>('FormShowEvent', (event) => {
      this.showForm(event.data.form);
      this.show();
    });

    EventManager.addListener<FormValidatedEvent>('FormValidatedEvent', () => {
      this.clearDialog();
      this.hide();
    });
  }

  public setVisible(isVisible: boolean): void {
    if (this.container) {
      const display = isVisible ? 'flex' : 'none';
      this.container.style.display = display;
    }
  }

  public show(): void {
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
    document.getElementById('game')?.focus();
  }

  private clearDialog(): void {
    if (this.body) {
      removeChildren(this.body);
    }
    this.data = {};
  }

  public showForm(data: Form): void {
    if (this.header) {
      this.header.innerText = data.label;
    }

    this.clearDialog();

    const form = document.createElement('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const submitEvent = {
        type: 'FormSubmitEvent',
        data: <FormSubmitEvent>{
          name: data.name,
          data: this.data,
        },
      };

      EventManager.emit(submitEvent);
    });

    if (data.description) {
      const description = document.createElement('p');
      description.innerText = data.description;
      form.appendChild(description);
    }

    for (const item of data.items) {
      const element = this.renderItem(item);
      form.appendChild(element);
    }

    // Render messages
    const { messages = [] } = data;
    if (messages.length > 0) {
      // Create element
      const messagesContainer = document.createElement('div');
      messagesContainer.className = 'col errors';

      for (const message of messages) {
        const messageElement = document.createElement('div');
        messageElement.innerText = message;
        messageElement.className = 'error';
        messagesContainer.appendChild(messageElement);
      }

      form.appendChild(messagesContainer);
    }

    const submitRow = document.createElement('div');
    submitRow.className = 'button-row footer';

    const submit = document.createElement('input');
    submit.type = 'submit';
    submitRow.appendChild(submit);

    form.appendChild(submitRow);

    this.body?.appendChild(form);
  }

  private renderItem(item: FormItem): HTMLElement {
    const container = document.createElement('div');
    container.className = 'form-item';

    const label = document.createElement('span');
    label.className = 'form-label';
    label.innerText = item.label;

    const input = document.createElement('input');
    input.className = 'form-value';
    input.type = item.type;

    switch (item.type) {
      case 'text':
        const { minLength, maxLength } = item;
        if (minLength !== undefined) {
          input.minLength = minLength;
        }
        if (maxLength !== undefined) {
          input.maxLength = maxLength;
        }
        break;
      case 'number':
        const { min, max } = item;
        if (min !== undefined) {
          input.min = '' + min;
        }
        if (max !== undefined) {
          input.max = '' + max;
        }
    }

    input.addEventListener('change', (_) => {
      let entry: Entry;
      switch (item.type) {
        case 'text':
          entry = {
            type: 'text',
            value: input.value,
          };
          break;
        case 'number':
          entry = {
            type: 'number',
            value: parseFloat(input.value),
          };
          break;
        case 'checkbox':
          entry = {
            type: 'boolean',
            value: input.checked,
          };
          break;
      }
      this.data[item.name] = entry;
    });

    if (item.type === 'checkbox') {
      input.checked = item.default ?? false;
    } else {
      if (item.default !== undefined) {
        input.value = item.default.toString();
      }
    }

    container.appendChild(label);
    container.appendChild(input);

    return container;
  }
}
