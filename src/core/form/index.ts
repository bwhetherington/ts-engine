import { FormManager } from "./manager";
import { Data } from "core/serialize";
import { Player } from "core/player";

export interface Form {
  name: string;
  label: string;
  description?: string;
  items: FormItem[];
}

export interface StringField {
  type: 'text';
  label: string;
  name: string;
  default?: string;
}

export interface NumberField {
  type: 'number';
  label: string;
  name: string;
  default?: number;
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
};

export interface FormSubmitEvent {
  name: string;
  data: Record<string, Entry>;
}

export interface FormType<T extends FormData> {
  name: string;
  form: Form;
  validate(x: FormData): x is T;
}

export interface FormShowEvent {
  form: Form;
}

export const FM = new FormManager();

export interface FormEntry<T> {
  name: string;
  form: Form;
  onSubmit(player: Player, response: T): void;
  validate(data: Data): data is T;
}
