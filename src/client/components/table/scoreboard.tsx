import React from 'react';
import {EventTable, Component, Panel, PanelHeader} from 'client/components';
import {EventManager} from 'core/event';
import {PlayerManager} from 'core/player';
import {TableEvent} from 'core/table';

const SCOREBOARD_COLUMNS = [
  {
    label: 'Name',
    field: 'name',
    width: '100px',
  },
  {
    label: 'Level',
    field: 'level',
    width: '50px',
  },
  {
    label: 'Score',
    field: 'xp',
    width: '50px',
  },
  // {
  //   label: 'Ping',
  //   field: 'ping',
  //   width: '50px',
  // },
];

export class Scoreboard extends Component<{}, {}> {
  public componentDidMount(): void {
    this.streamInterval(1).forEach(() => {
      const rows = PlayerManager.getPlayers()
        .filter(
          (player) => player.hasJoined && (player.hero?.isAlive() ?? false)
        )
        .map((player) => ({
          id: player.id,
          name: player.name,
          level: player.hero?.getLevel() ?? 0,
          xp: player.hero?.getExperience() ?? 0,
          ping: Math.round(player.ping * 1000) + 'ms',
        }))
        .take(10)
        .toArray();
      EventManager.emit<TableEvent>({
        type: 'TableEvent',
        data: {
          id: 'scoreboard',
          data: rows,
        },
      });
    });
  }

  public render(): JSX.Element {
    return (
      <Panel>
        <PanelHeader>
          <b>Scoreboard</b>
        </PanelHeader>
        <EventTable id="scoreboard" columns={SCOREBOARD_COLUMNS} />
      </Panel>
    );
  }
}
