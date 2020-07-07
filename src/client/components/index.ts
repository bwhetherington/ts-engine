import { ChatComponent } from 'client/components/chat';
import { Component, registerComponent } from 'client/components/util';
import { DebugComponent } from 'client/components/debug';

export function registerComponents() {
  registerComponent(ChatComponent);
  registerComponent(DebugComponent);
}

export { Component };