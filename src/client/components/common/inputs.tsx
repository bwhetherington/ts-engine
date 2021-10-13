import {InputManager} from 'client/input';
import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  margin: 2px;
  flex-grow: 1;
  font-family: inherit;
  border: none;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.67);
  height: 1.5em;
  color: white;
  padding: 5px;
  border-radius: 4px;
  font-size: inherit;
  font-weight: 500;
  pointer-events: auto;

  &:focus {
    outline: none;
    border-radius: 2px;
    content: normal;
  }
`;

interface InputProps<T> {
  value: T;
  onChange(x: T): void;
  isDisabled?: boolean;
  onKeyDown?: React.EventHandler<React.KeyboardEvent<HTMLInputElement>>;
  onKeyUp?: React.EventHandler<React.KeyboardEvent<HTMLInputElement>>;
}

function onValueChange(
  onChange: (x: string) => void
): (e: React.ChangeEvent<HTMLInputElement>) => void {
  return (e) => onChange(e.target.value);
}

type StringInputProps = InputProps<string> & {
  placeholder?: string;
  isPassword?: boolean;
};

export const StringInput = React.forwardRef<HTMLInputElement, StringInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      disabled={props.isDisabled ?? false}
      placeholder={props.placeholder}
      type={props.isPassword ? 'password' : 'text'}
      value={props.value}
      onChange={onValueChange(props.onChange)}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
    />
  )
);

function onNumberValueChange(
  onChange: (x: number) => void,
  parse: (s: string) => number
): (e: React.ChangeEvent<HTMLInputElement>) => void {
  return onValueChange((s) => onChange(parse(s)));
}

type NumberInputProps = InputProps<number> & {min: number; max: number};

export const FloatInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      disabled={props.isDisabled ?? false}
      type="number"
      min={props.min}
      max={props.max}
      value={props.value}
      onChange={onNumberValueChange(props.onChange, parseFloat)}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
    />
  )
);

export const IntInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      disabled={props.isDisabled ?? false}
      type="number"
      min={props.min}
      max={props.max}
      value={props.value}
      onChange={onNumberValueChange(props.onChange, parseInt)}
      onKeyDown={props.onKeyDown}
      onKeyUp={props.onKeyUp}
    />
  )
);

function onCheckboxValueChange(
  onChange: (x: boolean) => void
): (e: React.ChangeEvent<HTMLInputElement>) => void {
  return (e) => {
    onChange(e.target.checked);
  };
}

/*
input[type='checkbox'] {
  appearance: none;
  width: 1.5em;
  height: 1.5em;
  border-radius: 4px;
  margin: 2px;
  background: rgba(0, 0, 0, 0.67);
  outline: none;
  cursor: pointer;
}

input[type='checkbox']:hover {
  background-color: rgb(255, 255, 255, 0.25);
}

input[type='checkbox']:checked::after {
  background-color: rgba(255, 255, 255, 0.67);
  display: block;
  content: '';
  position: relative;

  left: var(--checkbox-padding);
  right: var(--checkbox-padding);
  top: var(--checkbox-padding);
  bottom: var(--checkbox-padding);

  width: calc(100% - 2 * var(--checkbox-padding));
  height: calc(100% - 2 * var(--checkbox-padding));
  border-radius: 2px;
}
*/

const StyledCheckbox = styled.input`
  appearance: none;
  width: 1.5em;
  height: 1.5em;
  border-radius: 4px;
  margin: 2px;
  background: rgba(0, 0, 0, 0.67);
  outline: none;
  cursor: pointer;

  &:hover {
    background-color: rgb(255, 255, 255, 0.25);
  }

  &:checked::after {
    background-color: rgba(255, 255, 255, 0.67);
    display: block;
    content: '';
    position: relative;

    left: var(--checkbox-padding);
    right: var(--checkbox-padding);
    top: var(--checkbox-padding);
    bottom: var(--checkbox-padding);

    width: calc(100% - 2 * var(--checkbox-padding));
    height: calc(100% - 2 * var(--checkbox-padding));
    border-radius: 2px;
  }
`;

StyledCheckbox.defaultProps = {
  type: 'checkbox',
};

type BooleanInputProps = InputProps<boolean>;

export const BooleanInput = React.forwardRef<
  HTMLInputElement,
  BooleanInputProps
>((props, ref) => (
  <StyledCheckbox
    ref={ref}
    disabled={props.isDisabled ?? false}
    onChange={onCheckboxValueChange(props.onChange)}
    checked={props.value}
    onKeyDown={props.onKeyDown}
    onKeyUp={props.onKeyUp}
  />
));
