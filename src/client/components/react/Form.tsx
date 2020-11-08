import React from 'react';
import { Component } from 'client/components/react';
import {
  FormItem,
  Form,
  FormSubmitEvent,
  Entry,
  FormShowEvent,
  FormValidatedEvent,
  NumberEntry,
  StringEntry,
  BooleanEntry,
  NumberField,
} from 'core/form';

type InputHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

interface NumberFieldProps {
  field: NumberField;
  value: number;
  onChange(value: NumberEntry): void;
}

function onNumberChange(onChange: (value: NumberEntry) => void): InputHandler {
  return (event) => {
    const value = parseFloat(event.target.value);
    onChange({ type: 'number', value });
  };
}

function NumberField({
  field,
  value,
  onChange,
}: NumberFieldProps): React.ReactElement {
  return (
    <div>
      <span>{field.label}</span>
      <input type="number" value={value} onChange={onNumberChange(onChange)} />
    </div>
  );
}

interface FieldProps {
  field: FormItem;
  onChange(name: string, value: Entry): void;
}

function Field({ field, onChange }: FieldProps): React.ReactElement {
  return <div></div>;
}

interface FormProps {
  form: Form;
}

interface FormState {
  [item: string]: Entry;
}

export class FormComponent extends Component<FormProps, FormState> {
  public constructor(props: FormProps) {
    super(props, {});
  }
}
