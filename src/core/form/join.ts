import { Form, FormData, StringField, FormType, FM, StringEntry } from "core/form";
import { EM } from "core/event";
import { ConnectEvent } from "core/net";
import { PM } from "core/player";
import { Data } from "core/serialize";
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

export interface JoinForm {
  name: StringEntry;
}

export function isJoinForm(form: Data): form is JoinForm {
  return form.name?.type === 'text' && typeof form.name?.value === 'string';
}

export const JOIN_FORM: Form = {
  name: 'Join Game',
  items: [
    {
      type: 'text',
      name: 'name',
      label: 'Display Name',
    }
  ]
}

export function registerJoinForm(): void {
  EM.addListener<ConnectEvent>('ConnectEvent', async (event) => {
    const player = PM.getPlayer(event.data.socket);
    if (player) {
      try {
        const response = await FM.sendForm(player, JOIN_FORM);
        if (isJoinForm(response)) {
          player.name = response.name.value;
        }
      } catch (ex) {
        if (ex instanceof Error) {
          LM.error(ex.message);
        }
      }
    }
  });
}