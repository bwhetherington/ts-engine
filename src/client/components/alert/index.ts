import { Component } from 'client/components';
import template from 'client/components/alert/template.html';
import { FormItem, Form, FormSubmitEvent, Entry, FormShowEvent } from 'core/form';
import { EM } from 'core/event';

export class AlertComponent extends Component {
  public static componentName: string = 'alert-component';

  private element?: HTMLElement;
  private header?: HTMLElement;
  private body?: HTMLElement;

  private data: Record<string, Entry> = {};

  public constructor() {
    super(template);
    this.header = this.queryChild('#header');
    this.element = this.queryChild('#alert');
    this.body = this.queryChild('#body');

    this.queryChild('#close')?.addEventListener('click', () => {
      this.hide();
    });

    EM.addListener<FormShowEvent>('FormShowEvent', event => {
      console.log(event);
      this.showForm(event.data.form);
      this.show();
    });
  }

  public setVisible(isVisible: boolean): void {
    if (this.element) {
      const display = isVisible ? 'block' : 'none';
      this.element.style.display = display;
    }
  }

  public show(): void {
    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }

  private clearDialog(): void {
    if (this.body) {
      this.removeChild(this.body);
    }
    this.data = {};
  }

  public showForm(data: Form): void {
    if (this.header) {
      this.header.innerText = data.name;
    }

    // this.clearDialog();

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
      EM.emit(submitEvent);
      console.log(submitEvent);

      // this.clearDialog();
      this.hide();
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

    const submitRow = document.createElement('div');
    submitRow.className = 'button-row';

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
    input.name = item.name;
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
