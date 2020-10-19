import React from 'react';

export enum BarStyle {
  Life,
  XP,
}

interface BarProps {
  value: number;
  maxValue: number;
  barStyle: BarStyle;
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
  // transition: 'width 0.25s',
};

const labelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  width: '100%',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.5)',
};

function formatLabel(value: number, maxValue: number): string {
  return `${Math.round(value)}/${Math.round(maxValue)}`;
}

export function Bar(props: BarProps): React.ReactElement {
  const widthPercent = (props.value / props.maxValue) * 100 + '%';
  const newBarStyle: React.CSSProperties = {
    ...barStyle,
    ...barStyles[props.barStyle],
    width: widthPercent,
  };
  return (
    <div style={containerStyle}>
      <div style={newBarStyle} />
      <span style={labelStyle}>{formatLabel(props.value, props.maxValue)}</span>
    </div>
  );
}
