import { LM as InternalLogger } from 'core/log';
import {
  ChatComponent,
  BarComponent,
  Component,
  registerComponents,
} from 'client/components';

const LM = InternalLogger.forFile(__filename);

export class UIManager {
  public chatbox?: ChatComponent;
  public healthBar?: BarComponent;

  public initialize(): void {
    registerComponents();
    this.chatbox = this.getComponent(ChatComponent, 'chat-box');
    this.healthBar = this.getComponent(BarComponent, 'hp-bar');
    LM.debug('UIManager initialized');
  }

  public getComponent<T extends Component>(
    type: (new (...args: any[]) => T) & typeof Component,
    id: string
  ): T | undefined {
    const element = document.getElementById(id);
    if (element instanceof type) {
      return element as T;
    }
    return undefined;
  }
}
