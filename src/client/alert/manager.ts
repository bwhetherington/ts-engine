import { LM as InternalLogger } from 'core/log';
import { AlertComponent } from 'client/components';
import { sleep } from 'core/util';
import { EM, Event, StepEvent } from 'core/event';
import { Form } from 'core/form';

const LM = InternalLogger.forFile(__filename);

export interface Dialog {}

export class AlertManager {
  private element?: AlertComponent;
  private counter: number = 0;

  public initialize() {
    const element = document.getElementById('alert');
    if (element instanceof AlertComponent) {
      this.element = element;
    } else {
      LM.error('<alert-component> could not be found');
    }

    EM.addListener('StepEvent', (event: Event<StepEvent>) => {
      if (this.counter > 0) {
        this.counter = Math.max(0, this.counter - event.data.dt);
      } else if (this.counter === 0) {
        // this.element?.hide();
      }
    });

    LM.debug('AlertManager initialized');
  }

  public showForm(form: Form): void {
    this.element?.showForm(form);
  }
}
