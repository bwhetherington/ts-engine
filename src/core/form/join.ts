import {
  Form,
  FormManager,
  StringEntry,
  FormEntry,
} from 'core/form';
import { EventManager } from 'core/event';
import { ConnectEvent } from 'core/net';
import { PlayerManager, Player } from 'core/player';
import { Data } from 'core/serialize';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

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
    {
      type: 'checkbox',
      name: 'test',
      label: 'Test',
    },
  ],
};

export function registerJoinForm(): void {
  EventManager.addListener<ConnectEvent>('ConnectEvent', async (event) => {
    const player = PlayerManager.getPlayer(event.data.socket);
    if (player) {
      FormManager.sendForm(player, 'JoinForm');
    }
  });
  FormManager.registerForm(JoinFormEntry);
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
