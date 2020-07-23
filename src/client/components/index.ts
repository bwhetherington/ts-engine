import { BarComponent } from 'client/components/bar';
import { ChatComponent } from 'client/components/chat';
import { Component, registerComponent } from 'client/components/util';
import { DebugComponent } from 'client/components/debug';
import { AlertComponent } from './alert';
import { UIManager } from './ui';

export function registerComponents() {
  registerComponent(BarComponent);
  registerComponent(ChatComponent);
  registerComponent(DebugComponent);
  registerComponent(AlertComponent);
}

export const UIM = new UIManager();

export {
  Component,
  BarComponent,
  ChatComponent,
  DebugComponent,
  AlertComponent,
};
