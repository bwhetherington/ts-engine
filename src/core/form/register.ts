import { Form, FormData, StringField, FormType, FM, StringEntry, NumberEntry, BooleanEntry } from "core/form";
import { EM } from "core/event";
import { ConnectEvent } from "core/net";
import { PM } from "core/player";
import { Data } from "core/serialize";
import { LM as InternalLogger } from 'core/log';
import { TextMessageInEvent } from "core/chat";

const LM = InternalLogger.forFile(__filename);

export interface RegisterForm {
  name: StringEntry;
  age: NumberEntry;
  gender: BooleanEntry;
}

export function isRegisterForm(form: Data): form is RegisterForm {
  return (form.name?.type === 'text' && typeof form.name?.value === 'string') &&
    (form.age?.type === 'number' && typeof form.number?.value === 'number') &&
    (form.gender?.type === 'checkbox' && typeof form.gender?.value === 'boolean');
}

export const REGISTER_FORM: Form = {
  label: 'Register',
  name: 'RegisterForm',
  description: 'Please register an account with us.',
  items: [
    {
      type: 'text',
      name: 'name',
      label: 'Name',
    },
    {
      type: 'number',
      name: 'age',
      label: 'Age',
    },
    {
      type: 'checkbox',
      name: 'gender',
      label: 'Gender',
    }
  ]
}

export function registerRegisterForm(): void {
  EM.addListener<TextMessageInEvent>('TextMessageInEvent', async (event) => {
    const player = PM.getPlayer(event.socket);
    if (player) {
      try {
        const response = await FM.sendForm(player, REGISTER_FORM);
        if (isRegisterForm(response)) {
          LM.info(`player registered: ${JSON.stringify(response)}`);
        }
      } catch (ex) {
        if (ex instanceof Error) {
          LM.error(ex.message);
        }
      }
    }
  });
}