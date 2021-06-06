import React from 'react';
import {
  Debug,
  Chat,
  EventBar,
  BarStyle,
  Scoreboard,
  FormContainer,
  UpgradeContainer,
  Radar,
} from 'client/components';
import {Column, Panel} from './common';

export const App: React.FunctionComponent<{}> = () => (
  <>
    <div className="top left">
      <Debug />
    </div>
    <div className="bottom left col">
      <Chat lineLimit={100} />
      <Panel>
        <Column>
          <EventBar label="HP" barStyle={BarStyle.Life} id="life-bar" />
          <EventBar label="XP" barStyle={BarStyle.XP} id="xp-bar" />
        </Column>
      </Panel>
    </div>
    <div className="bottom right">
      <Radar />
    </div>
    <div className="top right">
      <Scoreboard />
    </div>
    <FormContainer />
    <UpgradeContainer />
  </>
);
