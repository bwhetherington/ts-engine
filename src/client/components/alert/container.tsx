import React from 'react';
import {Column, Component, Props} from '@/client/components';
import {AlertEvent} from '@/core/alert';
import {EventManager, StepEvent} from '@/core/event';
import {UUID, UUIDManager} from '@/core/uuid';
import {AlertComponent} from '@/client/components/alert';
import {Empty} from '@/core/util';

interface AlertEntry {
  id: UUID;
  time: number;
  message: string;
}

interface State {
  alerts: AlertEntry[];
}

export class AlertContainer extends Component<Empty, State> {
  constructor(props: Props<Empty>) {
    super(props, {
      alerts: [],
    });
  }

  public override componentDidMount() {
    this.streamEvents<AlertEvent>('AlertEvent').forEach((event) => {
      this.addAlert(event.data);
    });
    this.streamInterval(0.5).forEach(() => {
      this.updateState({
        alerts: this.state.alerts.filter((alert) => {
          const age = EventManager.timeElapsed - alert.time;
          return age <= 5;
        }),
      });
    });
  }

  private async addAlert(alert: AlertEvent) {
    const entry = {
      id: UUIDManager.generate(),
      time: EventManager.timeElapsed,
      message: alert.message,
    };
    await this.updateState({
      alerts: [...this.state.alerts, entry],
    });
  }

  public override render(): JSX.Element {
    const alerts = this.state.alerts.map((alert) => (
      <AlertComponent message={alert.message} key={alert.id} />
    ));
    return <Column>{alerts}</Column>;
  }
}
