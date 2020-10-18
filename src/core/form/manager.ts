import { LogManager } from 'core/log';
import { Player, PlayerManager } from 'core/player';
import { Data } from 'core/serialize';
import { EventManager } from 'core/event';
import {
  FormSubmitEvent,
  Form,
  FormShowEvent,
  FormEntry,
  FormRejectEvent,
} from 'core/form';
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
      let hasResolved = false;
      const id = EventManager.addListener<FormSubmitEvent>(
        'FormSubmitEvent',
        (event, id) => {
          const { socket, data } = event;
          if (socket === player.socket) {
            resolve(data.data);
            EventManager.removeListener('FormSubmitEvent', id);
            hasResolved = true;
          }
        }
      );
      await EventManager.sleep(timeout);
      if (!hasResolved) {
        EventManager.removeListener('FormSubmitEvent', id);
        log.warn(`form [${id}] timed out`);
        reject(new Error('Timeout'));
      }
    });

    return promise;
  }

  public async sendForm(
    player: Player,
    formName: string,
    messages: string[] = [],
    timeout: number = 60
  ): Promise<boolean> {
    const form = this.forms[formName];
    if (form) {
      try {
        const formWithMessages = {
          ...form,
          messages,
        };
        await this.sendFormInternal(player, formWithMessages, timeout);
        return true;
      } catch (ex) {
        if (ex instanceof Error) {
          log.error(ex.message);
        }
      }
    } else {
      log.error(`form ${formName} not found`);
    }

    EventManager.emit<FormRejectEvent>({
      type: 'FormRejectEvent',
      data: { player },
    });

    return false;
  }

  public registerForm<T extends Data>(formEntry: FormEntry<T>): void {
    log.trace(`form ${formEntry.name} registered`);
    const { name, form, checkType, validate, onSubmit, onReject } = formEntry;
    this.forms[name] = form;
    EventManager.addListener<FormSubmitEvent>(
      'FormSubmitEvent',
      async (event) => {
        const { socket, data } = event;
        const player = PlayerManager.getPlayer(socket);
        if (player) {
          const {
            name: responseName,
            data: response,
            method = 'submit',
          } = data;
          if (responseName === name) {
            if (checkType(response)) {
              const result = await validate(response, method, player);
              const {
                isValid,
                message = 'Error validating form.',
                data,
              } = result;
              if (isValid) {
                onSubmit(player, response, method, data);
                player.send({
                  type: 'FormValidatedEvent',
                  data: {},
                });
              } else {
                // Send the form back to the user
                this.sendForm(player, formEntry.name, [message]);
              }
            } else {
              // Send the form back to the user
              this.sendForm(player, formEntry.name, [
                'Response did not include all required fields.',
              ]);
            }
          }
        }
      }
    );
    if (onReject) {
      EventManager.addListener<FormRejectEvent>('FormRejectEvent', (event) => {
        const { player } = event.data;
        onReject(player);
      });
    }
  }
}
