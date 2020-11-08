import React from 'react';
import { Component } from 'client/components/react/Component';
import { Bar, BarStyle } from 'client/components/react/Bar';
import { BarUpdateEvent } from 'core/util';

interface EventBarProps {
  id: string;
  barStyle: BarStyle;
  label?: string;
}

interface EventBarState {
  value: number;
  maxValue: number;
}

export class EventBar extends Component<EventBarProps, EventBarState> {
  public constructor(props: EventBarProps) {
    super(props, {
      value: 1,
      maxValue: 1,
    });
  }

  public componentDidMount(): void {
    this.addListener<BarUpdateEvent>('BarUpdateEvent', (event) => {
      const { id, value, maxValue } = event.data;
      if (id === this.props.id) {
        this.updateState({
          value,
          maxValue,
        });
      }
    });
  }

  public render(): React.ReactElement {
    return (
      <Bar
        barStyle={this.props.barStyle}
        value={this.state.value}
        maxValue={this.state.maxValue}
        label={this.props.label}
      />
    );
  }
}
