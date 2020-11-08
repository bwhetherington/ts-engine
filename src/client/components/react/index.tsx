export * from 'client/components/react/Component';
export * from 'client/components/react/Bar';
export * from 'client/components/react/EventBar';

import React from 'react';
import ReactDOM from 'react-dom';
import { BarStyle } from './Bar';
import { Chat } from './Chat';
import { Debug } from './Debug';
import { EventBar } from './EventBar';

export function loadReactUI(id: string = 'react-pane') {
  const element = document.getElementById(id);
  console.log(element);
  if (element) {
    console.log('loading react');
    const comp = (
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
      </>
    );
    ReactDOM.render(comp, element);
  }
}
