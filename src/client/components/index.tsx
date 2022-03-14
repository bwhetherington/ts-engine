export * from '@/client/components/Component';
export * from '@/client/components/common';
export * from '@/client/components/Bar';
export * from '@/client/components/EventBar';
export * from '@/client/components/Chat';
export * from '@/client/components/Debug';
export * from '@/client/components/table';
export * from '@/client/components/form';
export * from '@/client/components/Radar';
export * from '@/client/components/upgrade';
export * from '@/client/components/alert';
export * from '@/client/components/Effect';
export * from '@/client/components/Effects';

import {App} from '@/client/components/App';
import {LogManager} from '@/core/log';

import React from 'react';
import ReactDOM from 'react-dom';

export type Props<P> = {
  children?: React.ReactChildren;
  className?: string;
} & P;

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
