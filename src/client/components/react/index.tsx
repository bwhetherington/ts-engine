export * from 'client/components/react/Component';
export * from 'client/components/react/Bar';
export * from 'client/components/react/EventBar';

import React from 'react';
import ReactDOM from 'react-dom';
import { BarStyle } from './Bar';
import { Chat } from './Chat';
import { EventBar } from './EventBar';


export function loadReactUI(id: string = 'react-ui') {
  const element = document.getElementById('react-pane');
  console.log(element);
  if (element) {
    console.log('loading react');
    const comp = (
      <div className="top left col">
        <h1>Hello from React</h1>
        <EventBar barStyle={BarStyle.Life} id="life-bar" />
        <Chat lineLimit={100} />
      </div>
    );
    ReactDOM.render(comp, element);
  }
}
