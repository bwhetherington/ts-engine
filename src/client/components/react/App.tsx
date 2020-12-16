import React from 'react';
import { Debug, Chat, EventBar, BarStyle } from 'client/components/react';
import { FormContainer } from './form';
import { Radar } from './Radar';

export function App(): React.ReactElement {
  return (
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
      <FormContainer />
    </>
  );
}
