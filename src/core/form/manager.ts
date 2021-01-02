import {LogManager} from 'core/log';
import {Player, PlayerManager} from 'core/player';
import {Data} from 'core/serialize';
import {EventManager} from 'core/event';
import {
  FormSubmitEvent,
  Form,
  FormShowEvent,
  FormEntry,
  FormRejectEvent,
} from 'core/form';
import {NetworkManager} from 'core/net';
import {sleep} from 'core/util';
import {UUID, UUIDManager} from 'core/uuid';

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
    id: UUID,
    timeout: number
  ): Promise<Data> {
    // Send form to player
    const event = {
      type: 'FormShowEvent',
      data: <FormShowEvent>{
        form,
        id,
      },
    };
    player.send(event);

    const promise = new Promise<Data>(async (resolve, reject) => {
      let hasResolved = false;
      const listenerID = EventManager.addListener<FormSubmitEvent>(
        'FormSubmitEvent',
        (event, listenerID) => {
          const {socket, data} = event;
          if (socket === player.socket) {
            resolve(data.data);
            EventManager.removeListener('FormSubmitEvent', listenerID);
            hasResolved = true;
          }
        }
      );
      await EventManager.sleep(timeout);
      if (!hasResolved) {
        EventManager.removeListener('FormSubmitEvent', listenerID);
        log.warn(`form [${id}] timed out`);
        reject(new Error('Timeout'));

        // Free ID on timeout
        UUIDManager.free(id);
      }
    });

    return promise;
  }

  public async sendForm(
    player: Player,
    formName: string,
    id: UUID | null = null,
    messages: string[] = [],
    timeout: number = 60
  ): Promise<boolean> {
    const form = this.forms[formName];
    id = id ?? UUIDManager.generate();
    if (form) {
      try {
        const formWithMessages = {
          ...form,
          messages,
        };
        await this.sendFormInternal(player, formWithMessages, id, timeout);
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
      data: {player, id},
    });
    return false;
  }

  public registerForm<T extends Data>(formEntry: FormEntry<T>): void {
    log.trace(`form ${formEntry.name} registered`);
    const {name, form, checkType, validate, onSubmit, onReject} = formEntry;
    this.forms[name] = form;
    EventManager.addListener<FormSubmitEvent>(
      'FormSubmitEvent',
      async (event) => {
        const {socket, data} = event;
        const player = PlayerManager.getPlayer(socket);
        if (player) {
          const {name: responseName, data: response, method = 'submit', id} = data;
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
                  data: {id},
                });

                // Free ID on successful submission
                UUIDManager.free(id);
              } else {
                // Send the form back to the user
                this.sendForm(player, formEntry.name, id, [message]);
              }
            } else {
              // Send the form back to the user
              this.sendForm(player, formEntry.name, id, [
                'Response did not include all required fields.',
              ]);
            }
          }
        }
      }
    );
    if (onReject) {
      EventManager.addListener<FormRejectEvent>('FormRejectEvent', (event) => {
        const {player} = event.data;
        onReject(player);
      });
    }
  }
}
