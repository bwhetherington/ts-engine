import { LM as InternalLogger } from 'core/log';
import { AlertComponent } from 'client/components';
import { sleep } from 'core/util';
import { EM, Event, StepEvent } from 'core/event';

const LM = InternalLogger.forFile(__filename);

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

  public showMessage(message: string): void {
    if (this.element) {
      this.element?.setMessage(message);
      this.element?.show();
      this.counter = 3;
    } else {
      LM.error('element does not exist');
    }
  }
}
