import { ChatComponent } from 'client/components/chat';
import { Component } from 'client/components/util';

export function registerComponents() {
  ChatComponent.register();
}

export { Component };