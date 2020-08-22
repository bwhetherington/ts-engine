import { FormManager } from 'core/form/manager';
import { Data } from 'core/serialize';
import { Player } from 'core/player';
import { registerJoinForm } from 'core/form/join';
import { Socket } from 'dgram';

export interface Form {
  name: string;
  label: string;
  description?: string;
  messages?: string[];
  items: FormItem[];
}

export interface StringField {
  type: 'text';
  label: string;
  name: string;
  default?: string;
  minLength?: number;
  maxLength?: number;
}

export interface NumberField {
  type: 'number';
  label: string;
  name: string;
  default?: number;
  min?: number;
  max?: number;
}

export interface BooleanField {
  type: 'checkbox';
  label: string;
  name: string;
  default?: boolean;
}

export type FormItem = StringField | NumberField | BooleanField;

export interface FormSubmitEvent {
  name: string;
  data: Record<string, Entry>;
}

export interface FormValidatedEvent {}

export interface StringEntry {
  type: 'text';
  value: string;
}

export interface NumberEntry {
  type: 'number';
  value: number;
}

export interface BooleanEntry {
  type: 'boolean';
  value: boolean;
}

export type Entry = StringEntry | NumberEntry | BooleanEntry;

export interface FormData {
  [key: string]: Entry | undefined;
}

export interface FormSubmitEvent {
  name: string;
  data: Record<string, Entry>;
}

export interface FormRejectEvent {
  player: Player;
}

export interface FormType<T extends FormData> {
  name: string;
  form: Form;
  validate(x: FormData): x is T;
}

export interface FormShowEvent {
  form: Form;
}

const FM = new FormManager();

export interface FormResult {
  isValid: boolean;
  message?: string;
}

export interface FormEntry<T> {
  name: string;
  form: Form;
  onSubmit(player: Player, response: T): void;
  onReject?: (player: Player) => void;
  checkType(data: Data): data is T;
  validate(input: T, player?: Player): FormResult;
}

export { FM as FormManager, registerJoinForm };
