import { BarComponent } from 'client/components/bar';
import { ChatComponent } from 'client/components/chat';
import {
  Component,
  registerComponent,
  removeChildren,
} from 'client/components/util';
import { DebugComponent } from 'client/components/debug';
import { AlertComponent } from './alert';
import { UIManager } from './ui';
import { TableComponent } from './table';

export function registerComponents() {
  registerComponent(BarComponent);
  registerComponent(ChatComponent);
  registerComponent(DebugComponent);
  registerComponent(AlertComponent);
  registerComponent(TableComponent);
}

export const UIM = new UIManager();

export {
  Component,
  BarComponent,
  ChatComponent,
  DebugComponent,
  AlertComponent,
  removeChildren,
};
