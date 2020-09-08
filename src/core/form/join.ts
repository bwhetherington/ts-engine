import {
  Form,
  FormManager,
  StringEntry,
  FormEntry,
  FormResult,
  BooleanEntry,
  NumberEntry,
} from 'core/form';
import { EventManager } from 'core/event';
import { ConnectEvent } from 'core/net';
import { PlayerManager, Player } from 'core/player';
import { Data } from 'core/serialize';
import { LogManager } from 'core/log';
import { WorldManager, Hero, Heavy } from 'core/entity';
import { randomColor, hsv } from 'core/graphics/color';
import { sleep } from 'core/util';

const log = LogManager.forFile(__filename);

export interface JoinForm {
  name: StringEntry;
  hue: NumberEntry;
  checkbox: BooleanEntry;
}

export function isJoinForm(form: Data): form is JoinForm {
  return (
    form.name?.type === 'text' &&
    typeof form.name?.value === 'string' &&
    form.hue?.type === 'number' &&
    typeof form.hue?.value === 'number' &&
    form.checkbox?.type === 'boolean' &&
    typeof form.checkbox?.value === 'boolean'
  );
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
      minLength: 3,
      maxLength: 15,
    },
    {
      type: 'range',
      name: 'hue',
      label: 'Hue',
      min: 0,
      max: 359,
      default: 0,
    },
    {
      type: 'checkbox',
      name: 'checkbox',
      label: 'Checkbox',
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

function spawnHero(player: Player): Hero {
  const hero = WorldManager.spawn(Hero);
  const x = (Math.random() - 0.5) * 1120;
  const y = (Math.random() - 0.5) * 1120;
  hero.setPositionXY(x, y);
  hero.setPlayer(player);
  const color = randomColor();
  hero.setColor(color);
  return hero;
}

export const JoinFormEntry: FormEntry<JoinForm> = {
  name: 'JoinForm',
  form: JOIN_FORM,
  onSubmit(player: Player, response: JoinForm): void {
    player.name = response.name.value;
    const hero = spawnHero(player);
    const color = hsv(response.hue.value, 0.65, 0.9);
    hero.setColor(color);
    player.setHero(hero);
    player.hasJoined = true;
  },
  onReject(player: Player): void {
    player.disconnect();
  },
  checkType(x: Data): x is JoinForm {
    return isJoinForm(x);
  },
  async validate(input: JoinForm): Promise<FormResult> {
    const { name, hue } = input;

    if (hue.value < 0 || hue.value >= 360) {
      return {
        isValid: false,
        message: 'Hue must be in the range [0, 360).',
      };
    }

    if (name.value.length < 3) {
      return {
        isValid: false,
        message: 'Name must contain at least 3 characters.',
      };
    }
    if (name.value.length > 15) {
      return {
        isValid: false,
        message: 'Name must contain no more than 15 characters.',
      };
    }

    // Check if player already has this name
    const nameExists = PlayerManager.getPlayers().any(
      (player) => player.name === name.value
    );
    if (nameExists) {
      return {
        isValid: false,
        message: `The name '${name.value}' is already in use.`,
      };
    }

    return { isValid: true };
  },
};
