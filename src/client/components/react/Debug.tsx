import React from 'react';
import { Component } from 'client/components/react';
import { EventManager, StepEvent } from 'core/event';
import { MetricsManager } from 'client/metrics';
import { WorldManager } from 'core/entity';
import { MetricsEvent } from 'core/metrics';
import { PlayerManager } from 'core/player';
import { Column, Panel, PanelHeader } from 'client/components/react/common';

interface LineProps {
  label: string;
  value: string | number;
}

const Line: React.FunctionComponent<LineProps> = ({ label, value }) => (
  <div>
    <strong>{label}:</strong> {value.toLocaleString()}
  </div>
);

interface DebugState {
  fps: number;
  clientEntities: number;
  clientListeners: number;
  tps: number;
  serverEntities: number;
  serverListeners: number;
  ping: number;
}

export class Debug extends Component<{}, DebugState> {
  public constructor(props: {}) {
    super(props, {
      fps: 0,
      clientEntities: 0,
      clientListeners: 0,
      tps: 0,
      serverEntities: 0,
      serverListeners: 0,
      ping: 0,
    });
  }

  public componentDidMount(): void {
    this.addListener<StepEvent>('StepEvent', () => {
      this.updateState({
        fps: MetricsManager.getAverageFPS(),
        clientEntities: WorldManager.getEntityCount(),
        clientListeners: EventManager.getListenerCount(),
      });
    });

    this.addListener<MetricsEvent>('MetricsEvent', (event) => {
      // Calculate client ping
      const partialState: Partial<DebugState> = {
        tps: event.data.tps,
        serverEntities: event.data.entities,
        serverListeners: event.data.listeners,
      };
      const player = PlayerManager.getActivePlayer();
      if (player) {
        const ping = event.data.pings[player.id];
        partialState.ping = ping;
      }
      this.updateState(partialState);
    });
  }

  public render(): JSX.Element {
    return (
      <Panel>
        <PanelHeader>
          <b>Client</b>
        </PanelHeader>
        <div>
          <Line label="FPS" value={Math.round(this.state.fps)} />
          <Line label="Entities" value={this.state.clientEntities} />
          <Line label="Listeners" value={this.state.clientListeners} />
        </div>
        <PanelHeader>
          <b>Server</b>
        </PanelHeader>
        <div>
          <Line label="FPS" value={Math.round(this.state.tps)} />
          <Line label="Entities" value={this.state.serverEntities} />
          <Line label="Listeners" value={this.state.serverListeners} />
          <Line
            label="Latency"
            value={Math.round(this.state.ping * 1000) + 'ms'}
          />
        </div>
      </Panel>
    );
  }
}
