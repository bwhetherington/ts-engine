import { LM as InternalLogger } from 'core/log';
import { Player, PM } from 'core/player';
import { Data } from 'core/serialize';
import { v1 } from 'uuid';
import { EM } from 'core/event';
import { FormSubmitEvent, Form, FormShowEvent, FormEntry } from 'core/form';
import { NM } from 'core/net';
import { sleep } from 'core/util';

const LM = InternalLogger.forFile(__filename);

type FormResolver = (response: Data) => void;

export class FormManager {
  private forms: Record<string, Form> = {};

  public initialize(): void {
    LM.debug('FormManager initialized');

    if (NM.isClient()) {
      EM.addListener<FormSubmitEvent>('FormSubmitEvent', (event) => {
        NM.send(event);
      });
    }
  }

  public sendForm(
    player: Player,
    form: Form,
    timeout: number = 60
  ): Promise<Data> {
    // Send form to player
    const event = {
      type: 'FormShowEvent',
      data: <FormShowEvent>{
        form,
      },
    };
    player.send(event);

    const promise = new Promise<Data>(async (resolve, reject) => {
      const id = v1();
      EM.addListener<FormSubmitEvent>('FormSubmitEvent', (event, id) => {
        console.log(event);
        const { socket, data } = event;
        if (socket === player.socket) {
          resolve(data.data);
          EM.removeListener('FormSubmitEvent', id);
        }
      });
      await sleep(timeout);
      reject(new Error('Timeout'));
    });

    return promise;
  }

  public sendUserForm(
    player: Player,
    formName: string,
    timeout: number = 60
  ): void {
    const form = this.forms[formName];
    if (form) {
      try {
        this.sendForm(player, form, timeout);
      } catch (ex) {
        if (ex instanceof Error) {
          LM.error(ex.message);
        }
      }
    } else {
      LM.error(`form ${formName} not found`);
    }
  }

  public registerForm<T extends Data>(formEntry: FormEntry<T>): void {
    LM.debug(`form ${formEntry.name} registered`);
    const { name, form, validate, onSubmit } = formEntry;
    this.forms[name] = form;
    EM.addListener<FormSubmitEvent>('FormSubmitEvent', (event) => {
      const { socket, data } = event;
      const player = PM.getPlayer(socket);
      if (player) {
        const { name, data: response } = data;
        console.log('receive', data);
        if (name === name && validate(response)) {
          onSubmit(player, response);
        }
      }
    });
  }
}
