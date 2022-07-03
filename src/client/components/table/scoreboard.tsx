import React from 'react';

import {EventManager} from '@/core/event';
import {PlayerManager} from '@/core/player';
import {TableEvent} from '@/core/table';
import {Empty} from '@/core/util';

import {Component, EventTable, Panel, PanelHeader} from '@/client/components';

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
  {
    label: 'Ping',
    field: 'ping',
    width: '50px',
  },
];

export class Scoreboard extends Component<Empty, Empty> {
  public componentDidMount() {
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
          ping: `${Math.round(player.ping * 1000)}ms`,
        }))
        .take(10)
        .toArray();
      EventManager.emitEvent(TableEvent, {
        id: 'scoreboard',
        data: rows,
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
