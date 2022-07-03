import React from 'react';

import {BarUpdateEvent} from '@/core/util';

import {Bar, BarStyle} from '@/client/components/Bar';
import {Component} from '@/client/components/Component';

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

  public componentDidMount() {
    this.streamEvents(BarUpdateEvent)
      .map(({data}) => data)
      .filter(({id}) => id === this.props.id)
      .forEach(({value, maxValue}) => {
        this.updateState({
          value,
          maxValue,
        });
      });
  }

  public render(): JSX.Element {
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
