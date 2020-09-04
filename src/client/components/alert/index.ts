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
import { removeChildren, ElementFactory, Component } from 'client/components';

export class AlertComponent extends Component {
  public static componentName: string = 'alert-component';

  private container?: HTMLElement;
  private header?: HTMLElement;
  private body?: HTMLElement;
  private data: Record<string, Entry> = {};
  private inputs: Set<HTMLInputElement> = new Set();

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
    this.inputs.clear();
    this.data = {};
  }

  public showForm(data: Form): void {
    if (this.header) {
      this.header.innerText = data.label;
    }

    this.clearDialog();

    const form = ElementFactory.form();
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
      form.disabled = true;
      for (const input of this.inputs) {
        input.disabled = true;
      }
    });

    if (data.description) {
      const description = ElementFactory.create('p');
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
      const messagesContainer = ElementFactory.div();
      messagesContainer.className = 'col errors';

      for (const message of messages) {
        const messageElement = ElementFactory.div();
        messageElement.innerText = message;
        messageElement.className = 'error';
        messagesContainer.appendChild(messageElement);
      }

      form.appendChild(messagesContainer);
    }

    const submitRow = ElementFactory.div();
    submitRow.className = 'button-row footer';

    const submit = ElementFactory.input();
    submit.type = 'submit';
    submitRow.appendChild(submit);
    this.inputs.add(submit);

    form.appendChild(submitRow);

    this.body?.appendChild(form);
  }

  private renderItem(item: FormItem): HTMLElement {
    const container = ElementFactory.div();
    container.className = 'form-item';

    const label = ElementFactory.span();
    label.className = 'form-label';
    label.innerText = item.label;

    const input = ElementFactory.input();
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
    this.inputs.add(input);
    return container;
  }
}
