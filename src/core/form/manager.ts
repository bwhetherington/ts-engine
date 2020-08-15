import { LogManager } from 'core/log';
import { Player, PlayerManager } from 'core/player';
import { Data } from 'core/serialize';
import { EventManager } from 'core/event';
import { FormSubmitEvent, Form, FormShowEvent, FormEntry } from 'core/form';
import { NetworkManager } from 'core/net';
import { sleep } from 'core/util';

const log = LogManager.forFile(__filename);

type FormResolver = (response: Data) => void;

export class FormManager {
  private forms: Record<string, Form> = {};

  public initialize(): void {
    log.debug('FormManager initialized');

    if (NetworkManager.isClient()) {
      EventManager.addListener<FormSubmitEvent>('FormSubmitEvent', (event) => {
        NetworkManager.send(event);
      });
    }
  }

  private sendFormInternal(
    player: Player,
    form: Form,
    timeout: number
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
      const id = EventManager.addListener<FormSubmitEvent>(
        'FormSubmitEvent',
        (event, id) => {
          const { socket, data } = event;
          if (socket === player.socket) {
            resolve(data.data);
            EventManager.removeListener('FormSubmitEvent', id);
          }
        }
      );
      log.info('timeout: ' + timeout);
      await sleep(timeout);
      EventManager.removeListener('FormSubmitEvent', id);
      log.warn(`form [${id}] timed out`);
      reject(new Error('Timeout'));
    });

    return promise;
  }

  public async sendForm(
    player: Player,
    formName: string,
    timeout: number = 60
  ): Promise<void> {
    const form = this.forms[formName];
    if (form) {
      try {
        await this.sendFormInternal(player, form, timeout);
      } catch (ex) {
        if (ex instanceof Error) {
          log.error(ex.message);
        }
      }
    } else {
      log.error(`form ${formName} not found`);
    }
  }

  public registerForm<T extends Data>(formEntry: FormEntry<T>): void {
    log.trace(`form ${formEntry.name} registered`);
    const { name, form, checkType, onSubmit } = formEntry;
    this.forms[name] = form;
    EventManager.addListener<FormSubmitEvent>('FormSubmitEvent', (event) => {
      const { socket, data } = event;
      const player = PlayerManager.getPlayer(socket);
      if (player) {
        const { name, data: response } = data;
        if (name === name && checkType(response)) {
          onSubmit(player, response);
        }
      }
    });
  }
}
