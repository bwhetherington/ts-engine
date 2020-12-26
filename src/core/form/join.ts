import {Form, FormManager, StringEntry, FormEntry, FormResult} from 'core/form';
import {EventManager} from 'core/event';
import {ConnectEvent, NetworkManager} from 'core/net';
import {PlayerManager, Player} from 'core/player';
import {Data} from 'core/serialize';
import {LogManager} from 'core/log';
import {WorldManager, Hero} from 'core/entity';
import {randomColor} from 'core/graphics/color';
import {capitalize} from 'core/util';
import {BasicAuth, isOk} from 'core/net/http';
import {RNGManager} from 'core/random';

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
      name: 'login',
      label: 'Login',
      isOpaque: false,
    },
    {
      name: 'register',
      label: 'Register',
      isOpaque: false,
    },
    {
      name: 'noAccount',
      label: 'No Account',
      isOpaque: false,
    },
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

const LOGIN_SERVER = process.env.GAME_LOGIN_SERVER ?? '';

async function validateSubmit(input: JoinForm): Promise<FormResult> {
  const {username, password} = input;
  try {
    const res = await NetworkManager.http?.get(LOGIN_SERVER + '/login', {
      username: username.value,
      password: password.value,
    });
    if (res) {
      // Check that the user is not already logged in elsewhere
      const isValid = isOk(res.code);
      if (isValid && PlayerManager.findPlayer(capitalize(username.value))) {
        return {isValid: false, message: 'Account is already logged in.'};
      } else if (isValid) {
        return {isValid: true, data: res.data};
      } else {
        return {isValid: false, message: 'Invalid credentials.'};
      }
    }
    return {isValid: false, message: 'Invalid credentials.'};
  } catch (ex) {
    log.error('error connecting to player server: ' + ex.message);
    return {isValid: false, message: 'Could not connect to login server.'};
  }
}

async function handleSubmit(
  player: Player,
  response: JoinForm,
  data?: Data
): Promise<void> {
  const {username, password} = response;
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
  const defaultError = 'Something went wrong';
  try {
    const auth: BasicAuth = {
      username: input.username.value,
      password: input.password.value,
    };
    const res = await NetworkManager.http?.post('/register', auth);
    if (res && isOk(res.code)) {
      return {isValid: true, data: res.data};
    } else {
      return {isValid: false, message: res?.data.message ?? defaultError};
    }
  } catch (_) {
    return {isValid: false, message: defaultError};
  }
}

async function handleRegister(
  player: Player,
  response: JoinForm,
  data?: Data
): Promise<void> {
  if (!data) {
    log.warn(
      'account data was not transferring after registration; loading from database'
    );
    data = await NetworkManager.http?.get('/user/' + response.username.value);
  }
  if (data) {
    player.load({
      username: data.username,
      className: data.className,
      xp: data.xp,
      permissionLevel: data.permissionLevel,
    });
  } else {
    log.warn('could not load account for player: ' + response.username.value);
  }
}

function validateNoAccount(res: JoinForm): FormResult {
  const username = res.username.value;

  if (PlayerManager.findPlayer(username)) {
    return {isValid: false, message: 'A player already has that name.'};
  }

  const {length} = username;
  if (3 <= length && length <= 15) {
    return {isValid: true};
  } else {
    return {isValid: false, message: 'Username must be between 3 and 5 characters.'};
  }
}

function handleNoAccount(player: Player, res: JoinForm): void {
  player.load({
    username: res.username.value,
    xp: 0,
    className: 'Hero',
    permissionLevel: 0,
  });
}

export const JoinFormEntry: FormEntry<JoinForm> = {
  name: 'JoinForm',
  form: JOIN_FORM,
  async onSubmit(
    player: Player,
    response: JoinForm,
    method: string,
    data?: Data
  ): Promise<void> {
    switch (method) {
      case 'login':
        return await handleSubmit(player, response, data);
      case 'register':
        return await handleRegister(player, response, data);
      case 'noAccount':
        return handleNoAccount(player, response);
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
      case 'login':
        return await validateSubmit(input);
      case 'register':
        return await validateRegister(input);
      case 'noAccount':
        return validateNoAccount(input);
      default:
        return {isValid: false, message: 'Unknown submission method.'};
    }
  },
};
