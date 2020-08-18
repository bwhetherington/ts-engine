import {
  Form,
  FormManager,
  StringEntry,
  FormEntry,
  FormResult,
} from 'core/form';
import { EventManager } from 'core/event';
import { ConnectEvent } from 'core/net';
import { PlayerManager, Player } from 'core/player';
import { Data } from 'core/serialize';
import { LogManager } from 'core/log';
import { WorldManager, Hero } from 'core/entity';
import { Pistol, Bomb } from 'core/weapon';
import { randomColor } from 'core/graphics/color';

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
      maxLength: 10,
    }
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
  const weapon = new Pistol();
  hero.setWeapon(weapon);
  const color = randomColor(0.35, 0.75);
  hero.setColor(color);
  return hero;
}

export const JoinFormEntry: FormEntry<JoinForm> = {
  name: 'JoinForm',
  form: JOIN_FORM,
  onSubmit(player: Player, response: JoinForm): void {
    player.name = response.name.value;
    const hero = spawnHero(player);
    player.setHero(hero);
    player.hasJoined = true;
  },
  onReject(player: Player): void {
    player.disconnect();
  },
  checkType(x: Data): x is JoinForm {
    return isJoinForm(x);
  },
  validate(input: JoinForm): FormResult {
    return {
      isValid: true,
    };
  },
};