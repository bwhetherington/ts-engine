import { LogManager } from 'core/log';
import { AlertComponent } from 'client/components';
import { sleep } from 'core/util';
import { EventManager, Event, StepEvent } from 'core/event';
import { Form } from 'core/form';

const log = LogManager.forFile(__filename);

export interface Dialog { }

export class AlertManager {
  private element?: AlertComponent;
  private counter: number = 0;

  public initialize() {
    const element = document.getElementById('alert');
    if (element instanceof AlertComponent) {
      this.element = element;
    } else {
      log.error('<alert-component> could not be found');
    }

    EventManager.addListener('StepEvent', (event: Event<StepEvent>) => {
      if (this.counter > 0) {
        this.counter = Math.max(0, this.counter - event.data.dt);
      } else if (this.counter === 0) {
        // this.element?.hide();
      }
    });

    log.debug('AlertManager initialized');
  }

  public showForm(form: Form): void {
    this.element?.showForm(form);
  }
}
