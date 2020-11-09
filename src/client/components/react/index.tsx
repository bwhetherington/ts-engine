export * from 'client/components/react/Component';
export * from 'client/components/react/Bar';
export * from 'client/components/react/EventBar';
export * from 'client/components/react/Chat';
export * from 'client/components/react/Debug';

import { App } from 'client/components/react/App';
import { LogManager } from 'core/log';

import React from 'react';
import ReactDOM from 'react-dom';

const log = LogManager.forFile(__filename);

export function loadReactUI(id: string = 'react-pane') {
  const element = document.getElementById(id);
  if (element) {
    ReactDOM.render(<App />, element);
    log.trace('loaded React UI');
  } else {
    log.error('UI container not found');
  }
}
