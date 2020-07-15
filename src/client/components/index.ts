import { BarComponent, BarUpdateEvent } from 'client/components/bar';
import { ChatComponent } from 'client/components/chat';
import { Component, registerComponent } from 'client/components/util';
import { DebugComponent } from 'client/components/debug';
import { AlertComponent } from './alert';

export function registerComponents() {
  registerComponent(BarComponent);
  registerComponent(ChatComponent);
  registerComponent(DebugComponent);
  registerComponent(AlertComponent);
}

export {
  Component,
  BarComponent,
  BarUpdateEvent,
  ChatComponent,
  DebugComponent,
  AlertComponent,
};
