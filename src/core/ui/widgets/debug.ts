import {EventManager, StepEvent} from 'core/event';
import {MetricsManager} from 'client/metrics';
import {WorldManager} from 'core/entity';
import {MetricsEvent} from 'core/metrics';
import {PlayerManager} from 'core/player';
import {UUIDManager} from 'core/uuid';
import {VectorLike} from 'core/geometry';
import {MouseEvent} from 'core/input';
import {
  Panel,
  Widget,
  StatefulWidget,
  Text,
  functionalWidget,
  Row,
  Column,
  Alignment,
  Separator,
} from 'core/ui';
import {Paragraph} from '../text';

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
  mouse: VectorLike;
}

function convertVector(vec: VectorLike): string {
  const {x, y} = vec;
  return `${Math.floor(x)}, ${Math.floor(y)}`;
}

function getCurrentPosition(): string {
  const position = PlayerManager.getActivePlayer()?.hero?.position;
  if (!position) {
    return 'N/A';
  }

  return convertVector(position);
}

interface Line {
  label: string;
  value: any;
}

interface LinesProps {
  lines: Line[];
}

function formatValue(value: any): string {
  if (typeof value === 'number') {
    return '' + Math.round(value);
  } else {
    return '' + value;
  }
}

const Lines = functionalWidget((props: LinesProps) => {
  // Compute columns
  const left = [];
  const right = [];

  for (const {label, value} of props.lines) {
    left.push(
      new Text({
        text: label + ':',
        color: 'grey',
      })
    );
    right.push(
      new Text({
        text: formatValue(value),
      })
    );
  }

  return new Row({
    spacing: 3,
    children: [
      new Column({
        spacing: 1,
        alignment: Alignment.Begin,
        children: left,
      }),
      new Column({
        spacing: 1,
        alignment: Alignment.Begin,
        children: right,
      }),
    ],
  });
});

export class DebugWidget extends StatefulWidget<{}, DebugState> {
  protected state = {
    fps: 0,
    clientEntities: 0,
    clientListeners: 0,
    clientUuids: 0,
    tps: 0,
    serverEntities: 0,
    serverListeners: 0,
    ping: 0,
    serverUuids: 0,
    mouse: {x: 0, y: 0},
  };

  public onMount(): void {
    super.onMount();
    this.observer.streamEvents<StepEvent>('StepEvent').forEach(async () => {
      this.updateState({
        fps: MetricsManager.getAverageFPS(),
        clientEntities: WorldManager.getEntityCount(),
        clientListeners: EventManager.getListenerCount(),
        clientUuids: UUIDManager.getCount(),
      });
    });

    this.observer
      .streamEvents<MetricsEvent>('MetricsEvent')
      .forEach((event) => {
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
        this.updateState(partialState);
      });

    this.observer.streamEvents<MouseEvent>('MouseEvent').forEach((event) => {
      const pos = {
        x: event.data.x,
        y: event.data.y,
      };
      this.updateState({
        mouse: pos,
      });
    });
  }

  protected renderTemplate(): Widget<any> {
    return new Panel({
      children: [
        new Column({
          spacing: 2,
          alignment: Alignment.Begin,
          children: [
            new Lines({
              lines: [
                {label: 'FPS', value: this.state.fps},
                {label: 'Listeners', value: this.state.clientListeners},
              ],
            }),
            new Separator({
              width: 55,
            }),
            new Lines({
              lines: [
                {label: 'TPS', value: this.state.tps},
                {label: 'Listeners', value: this.state.serverListeners},
              ],
            }),
          ],
        }),
      ],
    });
  }
}
