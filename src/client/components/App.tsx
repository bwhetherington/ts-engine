import React from 'react';
import {
  Debug,
  Chat,
  EventBar,
  BarStyle,
  Scoreboard,
  FormContainer,
} from 'client/components';
import {Radar} from './Radar';

export const App: React.FunctionComponent<{}> = () => (
  <>
    <div className="top left">
      <Debug />
    </div>
    <div className="bottom left col">
      <Chat lineLimit={100} />
      <div className="dialog col">
        <EventBar label="HP" barStyle={BarStyle.Life} id="life-bar" />
        <EventBar label="XP" barStyle={BarStyle.XP} id="xp-bar" />
      </div>
    </div>
    <div className="bottom right">
      <Radar />
    </div>
    <div className="top right">
      <Scoreboard />
    </div>
    <FormContainer />
  </>
);
