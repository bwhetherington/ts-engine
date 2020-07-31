export interface Form {
  name: string;
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
