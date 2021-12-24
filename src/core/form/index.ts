import {FormManager} from 'core/form/manager';
import {Data} from 'core/serialize';
import {Player} from 'core/player';
import {registerJoinForm} from 'core/form/join';
import {UUID} from 'core/uuid';

export interface Form {
  name: string;
  label: string;
  description?: string;
  messages?: string[];
  items: Field[];
  submitMethods?: SubmitMethod[];
}

export interface StringField {
  type: 'text';
  label: string;
  name: string;
  default?: string;
  minLength?: number;
  maxLength?: number;
  isPassword?: boolean;
}

export interface NumberField {
  type: 'number';
  label: string;
  name: string;
  default?: number;
  min?: number;
  max?: number;
}

export interface RangeField {
  type: 'range';
  label: string;
  name: string;
  default: number;
  min: number;
  max: number;
}

export interface BooleanField {
  type: 'checkbox';
  label: string;
  name: string;
  default?: boolean;
}

export type Field = StringField | NumberField | BooleanField | RangeField;

export type FieldType = Field['type'];

export interface FormValidatedEvent {
  id: UUID;
}

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

export type EntryType = Entry['type'];

export interface FormData {
  [key: string]: Entry | undefined;
}

export interface SubmitMethod {
  name: string;
  label: string;
  isOpaque: boolean;
}

export interface FormSubmitEvent {
  name: string;
  data: Record<string, Entry>;
  method?: string;
  id: UUID;
}

export interface FormRejectEvent {
  player: Player;
  name: string;
  id: UUID;
}

export interface FormShowEvent {
  form: Form;
  id: UUID;
}

const FM = new FormManager();

export interface FormResult {
  isValid: boolean;
  message?: string;
  data?: Data;
}

export interface FormEntry<T> {
  name: string;
  form: Form;
  onSubmit(
    player: Player,
    response: T,
    method: string,
    validatedData?: Data
  ): void;
  onReject?: (player: Player) => void;
  checkType(data: Data): data is T;
  validate(input: T, method: string, player?: Player): Promise<FormResult>;
}

export {FM as FormManager, registerJoinForm};
