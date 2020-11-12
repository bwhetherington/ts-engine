import template from 'client/components/alert/template.html';
import {
  Field,
  Form,
  FormSubmitEvent,
  Entry,
  FormShowEvent,
  FormValidatedEvent,
  NumberEntry,
  StringEntry,
  BooleanEntry,
} from 'core/form';
import { EventManager } from 'core/event';
import { removeChildren, ElementFactory, Component } from 'client/components';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export class AlertComponent extends Component {
  public static componentName: string = 'alert-component';

  private container?: HTMLElement;
  private header?: HTMLElement;
  private body?: HTMLElement;
  private data: Record<string, Entry> = {};
  private inputs: Set<HTMLInputElement> = new Set();
  private name?: string;
  private form?: HTMLFormElement;
  private submitMethod: string = 'submit';

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

  private onSubmit(): void {
    if (this.name && this.data && this.form) {
      const submitEvent = {
        type: 'FormSubmitEvent',
        data: <FormSubmitEvent>{
          name: this.name,
          data: this.data,
          method: this.submitMethod ?? 'submit',
        },
      };

      EventManager.emit(submitEvent);
      log.debug('submit ' + JSON.stringify(submitEvent));
      this.form.disabled = true;
      for (const input of this.inputs) {
        input.disabled = true;
      }
    }
  }

  public showForm(data: Form): void {
    if (this.header) {
      this.header.innerText = data.label;
    }

    this.clearDialog();

    const form = ElementFactory.form();
    this.form = form;
    this.name = data.name;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.onSubmit();
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

    // Create submit row
    if (data.submitMethods) {
      for (const method of data.submitMethods) {
        const item = ElementFactory.button();
        item.innerText = method.label;

        if (method.isOpaque) {
          item.setAttribute('style', 'opaque');
        }

        item.addEventListener('click', (event) => {
          event.preventDefault();
          this.submitMethod = method.name;
          this.onSubmit();
        });

        submitRow.appendChild(item);
      }
    } else {
      // const submit = ElementFactory.button();
      // submit.type = 'submit';
      // submit.innerText = 'Submit';
      // submitRow.appendChild(submit);
    }

    form.appendChild(submitRow);

    this.body?.appendChild(form);
  }

  private renderItem(item: Field): HTMLElement {
    const container = ElementFactory.div();
    container.className = 'form-item';

    const label = ElementFactory.span();
    label.className = 'form-label';
    label.innerText = item.label;

    const input = ElementFactory.input();
    input.className = 'form-value';
    input.type = item.type;

    let entry: Entry | undefined = undefined;
    switch (item.type) {
      case 'checkbox':
        entry = {
          type: 'boolean',
          value: false,
        };
        break;
      case 'text':
        const { minLength, maxLength } = item;
        if (minLength !== undefined) {
          input.minLength = minLength;
        }
        if (maxLength !== undefined) {
          input.maxLength = maxLength;
        }
        if (item.isPassword) {
          input.type = 'password';
        }
        entry = {
          type: 'text',
          value: '',
        };
        break;
      case 'range':
      case 'number':
        const { min, max, default: value } = item;
        if (min !== undefined) {
          input.min = '' + min;
        }
        if (max !== undefined) {
          input.max = '' + max;
        }
        if (value !== undefined) {
          input.value = '' + value;
          entry = {
            type: 'number',
            value,
          };
        }
        break;
    }

    if (entry) {
      this.data[item.name] = entry;
    }

    let valueLabel: HTMLElement | null = null;
    if (item.type === 'range') {
      valueLabel = ElementFactory.span();
      valueLabel.className = 'range-label';
      valueLabel.innerText = '' + (item.default ?? 0);
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
        case 'range':
          if (valueLabel) {
            valueLabel.innerText = input.value;
          }
        // Deliberately do not break here
        // This allows us to cascade into 'number'
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
    if (valueLabel) {
      container.appendChild(valueLabel);
    }
    container.appendChild(input);
    this.inputs.add(input);
    return container;
  }
}
