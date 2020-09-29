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
import { ConnectEvent, NetworkManager } from 'core/net';
import { PlayerManager, Player } from 'core/player';
import { Data } from 'core/serialize';
import { LogManager } from 'core/log';
import { WorldManager, Hero, Heavy } from 'core/entity';
import { randomColor, hsv } from 'core/graphics/color';
import { capitalize, sleep } from 'core/util';
import { updateShorthandPropertyAssignment } from 'typescript';
import { BasicAuth, isOk } from 'core/net/http';

const log = LogManager.forFile(__filename);

export interface JoinForm {
  username: StringEntry;
  password: StringEntry;
}

export function isJoinForm(form: Data): form is JoinForm {
  return (
    form.username?.type === 'text' &&
    typeof form.username?.value === 'string' &&
    form.password?.type === 'text' &&
    typeof form.password?.value === 'string'
  );
}

export const JOIN_FORM: Form = {
  label: 'Join Game',
  name: 'JoinForm',
  description: 'Please enter a name when joining the game.',
  submitMethods: [
    {
      name: 'submit',
      label: 'Submit',
      isOpaque: false,
    },
    {
      name: 'register',
      label: 'Register',
      isOpaque: false,
    }
  ],
  items: [
    {
      type: 'text',
      name: 'username',
      label: 'Username',
    },
    {
      type: 'text',
      name: 'password',
      label: 'Password',
      isPassword: true,
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

async function validateSubmit(input: JoinForm): Promise<FormResult> {
  const { username, password } = input;
  try {
    const res = await NetworkManager.http?.get('/login', {
      username: username.value,
      password: password.value,
    });
    if (res) {
      // Check that the user is not already logged in elsewhere
      const isValid = isOk(res.code);
      if (isValid && PlayerManager.findPlayer(capitalize(username.value))) {
        return { isValid: false, message: 'Account is already logged in.' };
      } else if (isValid) {
        return { isValid: true, data: res.data };
      } else {
        return { isValid: false, message: 'Invalid credentials.' };
      }
    }
    return { isValid: false, message: 'Invalid credentials.' };
  } catch (_) {
    return { isValid: false, message: 'Could not connect to login server.' };
  }
}

async function handleSubmit(player: Player, response: JoinForm, data?: Data): Promise<void> {
  const { username, password } = response;
  const auth: BasicAuth = {
    username: username.value,
    password: password.value,
  };

  let validated = data;
  if (!validated) {
    // If we didn't receive a validated account, try again
    validated = (await NetworkManager.http?.get('/login', auth))?.data;
  }

  if (validated) {
    player.load({
      username: validated.username,
      xp: validated.xp,
      className: validated.className,
      permissionLevel: validated.permissionLevel,
    });
    player.setAuth(auth);
  }
}

async function validateRegister(input: JoinForm): Promise<FormResult> {
  const { username } = input;
  try {
    const res = await NetworkManager.http?.get('/user/' + username.value);
    if (res && res.code === 404) {
      return { isValid: true };
    } else {
      return { isValid: false, message: 'Cannot create an account with the specified username.' };
    }
  } catch (_) {
    return { isValid: false, message: 'Cannot create an account with the specified username.' };
  }
}

async function handleRegister(player: Player, response: JoinForm): Promise<void> {
  const auth: BasicAuth = {
    username: response.username.value,
    password: response.password.value,
  };
  const res = await NetworkManager.http?.post('/register', auth);
  console.log(res);
  if (res && isOk(res.code)) {
    player.load({
      username: res.data.username,
      xp: res.data.xp,
      className: res.data.className,
      permissionLevel: res.data.permissionLevel,
    });
  }
}

export const JoinFormEntry: FormEntry<JoinForm> = {
  name: 'JoinForm',
  form: JOIN_FORM,
  async onSubmit(player: Player, response: JoinForm, method: string, data?: Data): Promise<void> {
    switch (method) {
      case 'submit':
        return await handleSubmit(player, response, data);
      case 'register':
        return await handleRegister(player, response);
    }
    await handleSubmit(player, response, data);
  },
  onReject(player: Player): void {
    player.disconnect();
  },
  checkType(x: Data): x is JoinForm {
    return isJoinForm(x);
  },
  async validate(input: JoinForm, method: string): Promise<FormResult> {
    switch (method) {
      case 'submit':
        return await validateSubmit(input);
      case 'register':
        return await validateRegister(input);
      default:
        return { isValid: false, message: 'Unknown submission method.' };
    }
  },
};
