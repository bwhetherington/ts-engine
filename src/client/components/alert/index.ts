import { Component } from 'client/components/util';
import template from 'client/components/alert/template.html';

export class AlertComponent extends Component {
  public static componentName: string = 'alert-component';

  private element?: HTMLElement;
  private message?: HTMLElement;

  public constructor() {
    super(template);
    this.element = this.queryChild('#alert');
    this.message = this.queryChild('#message');

    this.queryChild('#close')?.addEventListener('click', () => {
      this.hide();
    });

    this.show();
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

  public setMessage(m: string): void {
    if (this.message) {
      this.message.innerText = m;
    }
  }
}
