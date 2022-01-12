import {Form, FormManager, StringEntry, FormEntry, FormResult} from 'core/form';
import {PlayerManager, Player} from 'core/player';
import {Data} from 'core/serialize';
import {LogManager} from 'core/log';
import {capitalize} from 'core/util';

const log = LogManager.forFile(__filename);

export interface RenameForm {
  name: StringEntry;
}

export function isRenameForm(form: Data): form is RenameForm {
  return form.name?.type === 'text' && typeof form.name?.value === 'string';
}

export const RENAME_FORM: Form = {
  label: 'Rename',
  name: 'RenameForm',
  description: 'Please enter a new name.',
  items: [
    {
      type: 'text',
      name: 'name',
      label: 'Display Name',
      minLength: 3,
      maxLength: 15,
    },
  ],
};

export const RenameFormEntry: FormEntry<RenameForm> = {
  name: 'RenameForm',
  form: RENAME_FORM,
  onSubmit(player: Player, response: RenameForm) {
    player.name = response.name.value;
  },
  checkType(x: Data): x is RenameForm {
    return isRenameForm(x);
  },
  async validate(
    input: RenameForm,
    _: string,
    player: Player
  ): Promise<FormResult> {
    const {
      name: {value},
    } = input;
    const name = capitalize(value);
    if (name.length < 3) {
      return {
        isValid: false,
        message: 'Name must contain at least 3 characters.',
      };
    }
    if (name.length > 15) {
      return {
        isValid: false,
        message: 'Name must contain no more than 15 characters.',
      };
    }

    // Check if player already has this name
    const nameExists = PlayerManager.getPlayers()
      .filter((other) => player !== other)
      .any((player) => player.name === name);
    if (nameExists) {
      return {
        isValid: false,
        message: `The name '${name}' is already in use.`,
      };
    }

    return {isValid: true};
  },
};

export function registerRenameForm() {
  FormManager.registerForm(RenameFormEntry);
}
