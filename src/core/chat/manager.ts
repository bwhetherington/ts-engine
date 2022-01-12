import {Event} from '@/core/event';
import {
  TextMessageOutEvent,
  TextComponent,
  renderInfo,
  renderWarn,
  renderError,
} from '@/core/chat';
import {LogManager} from '@/core/log';
import {Player} from '@/core/player';

const log = LogManager.forFile(__filename);

export abstract class ChatManager {
  protected abstract dispatch(
    event: Event<TextMessageOutEvent>,
    socket?: number
  ): void;

  public initialize() {
    log.debug('ChatManager initialized');
  }

  public sendComponents(
    components: (string | null | TextComponent)[],
    target: number | Player = -1
  ) {
    const outEvent: Event<TextMessageOutEvent> = {
      type: 'TextMessageOutEvent',
      data: {
        components,
      },
    };
    const socket = target instanceof Player ? target.socket : target;
    this.dispatch(outEvent, socket);
  }

  public info(message: string, target: number | Player = -1) {
    const components = renderInfo(message);
    this.sendComponents(components, target);
    log.info('[' + message + ']');
  }

  public warn(message: string, target: number | Player = -1) {
    const components = renderWarn(message);
    this.sendComponents(components, target);
    log.warn('[' + message + ']');
  }

  public error(message: string, target: number | Player = -1) {
    const components = renderError(message);
    this.sendComponents(components, target);
    log.error('[' + message + ']');
  }
}
