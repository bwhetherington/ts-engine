import {LogManager} from '@/core/log';
import {Player, PlayerManager} from '@/core/player';
import {Data} from '@/core/serialize';
import {Event, EventManager, Priority} from '@/core/event';
import {
  FormSubmitEvent,
  Form,
  FormShowEvent,
  FormEntry,
  FormRejectEvent,
} from '@/core/form';
import {NetworkManager} from '@/core/net';
import {UUID, UUIDManager} from '@/core/uuid';

const log = LogManager.forFile(__filename);

type FormSubmitHandler = (event: Event<FormSubmitEvent>) => void;
type FormRejectHandler = (event: Event<FormRejectEvent>) => void;

export class FormManager {
  private forms: Record<string, Form> = {};
  private submitHandlers: Record<string, FormSubmitHandler> = {};
  private rejectHandlers: Record<string, FormRejectHandler> = {};

  public initialize() {
    log.debug('FormManager initialized');

    if (NetworkManager.isServer()) {
      EventManager.streamEvents(FormSubmitEvent, Priority.Normal, true)
        .filterMap((event) => {
          const {name} = event.data;
          const handler = this.submitHandlers[name];
          if (handler) {
            return [event, handler] as const;
          }
        })
        .forEach(([event, handler]) => handler(event));
      EventManager.streamEvents(FormRejectEvent)
        .filterMap((event) => {
          const {name} = event.data;
          const handler = this.rejectHandlers[name];
          if (handler) {
            return [event, handler] as const;
          }
        })
        .forEach(([event, handler]) => handler(event));
    }
  }

  private sendFormInternal(
    player: Player,
    form: Form,
    id: UUID,
    timeout: number
  ): Promise<Data> {
    // Send form to player
    player.sendEvent<FormShowEvent>({
      type: 'FormShowEvent',
      data: {
        form,
        id,
      },
    });

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

    EventManager.emitEvent(FormRejectEvent, {
      player,
      id,
      name: formName,
    });
    return false;
  }

  public registerForm<T extends Data>(formEntry: FormEntry<T>) {
    log.debug(`form ${formEntry.name} registered`);
    // eslint-disable-next-line
    const {name, form, checkType, validate, onSubmit, onReject} = formEntry;
    this.forms[name] = form;
    const formSubmitHandler = async (event: Event<FormSubmitEvent>) => {
      const {socket, data} = event;
      log.debug(`receive form submit ${socket ?? 'undefined'}`);
      const player = PlayerManager.getSocket(socket);
      if (player) {
        const {data: response, method = 'submit', id} = data;
        if (checkType(response)) {
          const result = await validate(response, method, player);
          const {isValid, message = 'Error validating form.', data} = result;
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
    };

    this.submitHandlers[name] = formSubmitHandler;
    if (onReject) {
      this.rejectHandlers[name] = (event) => {
        const {player} = event.data;
        onReject(player);
      };
    }
  }
}
