import React from 'react';
import {Component, Panel, PanelHeader, Line, Props} from '@/client/components';
import {EventManager, StepEvent} from '@/core/event';
import {MetricsManager} from '@/client/metrics';
import {WorldManager} from '@/core/entity';
import {MetricsEvent} from '@/core/metrics';
import {PlayerManager} from '@/core/player';
import {UUIDManager} from '@/core/uuid';
import {Empty} from '@/core/util';

interface DebugState {
  fps: number;
  clientEntities: number;
  clientListeners: number;
  clientUuids: number;
  tps: number;
  serverEntities: number;
  serverListeners: number;
  ping: number;
  serverUuids: number;
}

export class Debug extends Component<Empty, DebugState> {
  public constructor(props: Props<Empty>) {
    super(props, {
      fps: 0,
      clientEntities: 0,
      clientListeners: 0,
      clientUuids: 0,
      tps: 0,
      serverEntities: 0,
      serverListeners: 0,
      ping: 0,
      serverUuids: 0,
    });
  }

  public componentDidMount() {
    this.streamEvents(StepEvent).forEach(async () => {
      await this.updateState({
        fps: MetricsManager.getAverageFPS(),
        clientEntities: WorldManager.getEntityCount(),
        clientListeners: EventManager.getListenerCount(),
        clientUuids: UUIDManager.getCount(),
      });
    });

    this.streamEvents(MetricsEvent).forEach(async (event) => {
      // Calculate client ping
      const partialState: Partial<DebugState> = {
        tps: event.data.tps,
        serverEntities: event.data.entities,
        serverListeners: event.data.listeners,
        serverUuids: event.data.uuids,
      };
      const player = PlayerManager.getActivePlayer();
      if (player) {
        const ping = event.data.pings[player.id];
        partialState.ping = ping;
      }
      await this.updateState(partialState);
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
          <Line label="TPS" value={Math.round(this.state.tps)} />
          <Line label="Entities" value={this.state.serverEntities} />
          <Line label="Listeners" value={this.state.serverListeners} />
          <Line
            label="Latency"
            value={`${Math.round(this.state.ping * 1000)}ms`}
          />
        </div>
      </Panel>
    );
  }
}
