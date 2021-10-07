import {clamp} from 'core/util';
import React from 'react';

export enum BarStyle {
  Life,
  XP,
}

interface BarProps {
  value: number;
  maxValue: number;
  barStyle: BarStyle;
  label?: string;
}

const barStyles: Record<BarStyle, React.CSSProperties> = {
  [BarStyle.Life]: {
    backgroundColor: 'rgb(40, 160, 40)',
  },
  [BarStyle.XP]: {
    backgroundColor: 'rgb(32, 128, 192)',
  },
};

const containerStyle: React.CSSProperties = {
  height: '1.75em',
  backgroundColor: 'rgba(0, 0, 0, 0.67)',
  borderRadius: '2px',
  overflow: 'hidden',
  verticalAlign: 'middle',
  margin: '2px',
  position: 'relative',
  flexGrow: 1,
};

const barStyle: React.CSSProperties = {
  boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.5)',
  height: '100%',
  transition: 'width 0.25s',
};

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  bottom: '20%',
  width: '100%',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.5)',
};

const textLabelStyle: React.CSSProperties = {
  fontWeight: 'bold',
};

function formatLabel(value: number, maxValue: number): string {
  return `${Math.round(value).toLocaleString()}/${Math.round(
    maxValue
  ).toLocaleString()}`;
}

interface BarLabelProps {
  value: number;
  maxValue: number;
  label?: string;
}

function BarLabel(props: BarLabelProps): JSX.Element {
  return (
    <span style={labelStyle}>
      {props.label && <span style={textLabelStyle}>{props.label} </span>}
      {formatLabel(props.value, props.maxValue)}
    </span>
  );
}

export function Bar(props: BarProps): JSX.Element {
  const widthPercent = clamp(props.value / props.maxValue, 0, 1) * 100 + '%';
  const newBarStyle: React.CSSProperties = {
    ...barStyle,
    ...barStyles[props.barStyle],
    width: widthPercent,
  };
  return (
    <div style={containerStyle}>
      <div style={newBarStyle} />
      <BarLabel
        value={props.value}
        maxValue={props.maxValue}
        label={props.label}
      />
    </div>
  );
}
