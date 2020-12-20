export {EF as ElementFactory} from 'client/components/factory';
export {Component, removeChildren} from 'client/components/util';
export * from 'client/components/react';

import {registerComponent} from 'client/components/util';
import {BarComponent} from 'client/components/bar';
import {ChatComponent} from 'client/components/chat';
import {DebugComponent} from 'client/components/debug';
import {AlertComponent} from 'client/components/alert';
import {TableComponent} from 'client/components/table';

export function registerComponents() {
  registerComponent(BarComponent);
  registerComponent(ChatComponent);
  registerComponent(DebugComponent);
  registerComponent(AlertComponent);
  registerComponent(TableComponent);
}

export {
  registerComponent,
  BarComponent,
  ChatComponent,
  DebugComponent,
  AlertComponent,
  TableComponent,
};
