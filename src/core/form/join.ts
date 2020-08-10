import {
  Form,
  FormData,
  StringField,
  FormType,
  FM,
  StringEntry,
  FormEntry,
} from 'core/form';
import { EM } from 'core/event';
import { ConnectEvent } from 'core/net';
import { PM, Player } from 'core/player';
import { Data } from 'core/serialize';
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

export interface JoinForm {
  name: StringEntry;
}

export function isJoinForm(form: Data): form is JoinForm {
  return form.name?.type === 'text' && typeof form.name?.value === 'string';
}

export const JOIN_FORM: Form = {
  label: 'Join Game',
  name: 'JoinForm',
  description: 'Please enter a name when joining the game.',
  items: [
    {
      type: 'text',
      name: 'name',
      label: 'Display Name',
    },
  ],
};

export function registerJoinForm(): void {
  EM.addListener<ConnectEvent>('ConnectEvent', async (event) => {
    const player = PM.getPlayer(event.data.socket);
    if (player) {
      FM.sendUserForm(player, 'JoinForm');
    }
  });
  FM.registerForm(JoinFormEntry);
}

export const JoinFormEntry: FormEntry<JoinForm> = {
  name: 'JoinForm',
  form: JOIN_FORM,
  onSubmit(player: Player, response: JoinForm): void {
    player.name = response.name.value;
  },
  validate(x: Data): x is JoinForm {
    return isJoinForm(x);
  },
};
