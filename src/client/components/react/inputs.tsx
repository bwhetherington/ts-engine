import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  margin: 2px;
  flex-grow: 1;
  font-family: inherit;
  border: none;
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
}

function onValueChange(
  onChange: (x: string) => void
): (e: React.ChangeEvent<HTMLInputElement>) => void {
  return (e) => onChange(e.target.value);
}

type StringInputProps = InputProps<string> & { placeholder?: string };

export const StringInput = React.forwardRef<HTMLInputElement, StringInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      placeholder={props.placeholder}
      type="text"
      value={props.value}
      onChange={onValueChange(props.onChange)}
    />
  )
);

function onNumberValueChange(
  onChange: (x: number) => void,
  parse: (s: string) => number
): (e: React.ChangeEvent<HTMLInputElement>) => void {
  return onValueChange((s) => onChange(parse(s)));
}

type NumberInputProps = InputProps<number> & { min: number; max: number };

export const FloatInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      type="number"
      min={props.min}
      max={props.max}
      value={props.value}
      onChange={onNumberValueChange(props.onChange, parseFloat)}
    />
  )
);

export const IntInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => (
    <StyledInput
      ref={ref}
      type="number"
      min={props.min}
      max={props.max}
      value={props.value}
      onChange={onNumberValueChange(props.onChange, parseInt)}
    />
  )
);
