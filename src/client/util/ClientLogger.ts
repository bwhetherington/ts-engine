import {AbstractLogger, ClientLogEvent, LogLevel} from '@/core/log';
import {NetworkManager} from '@/core/net';

export class ClientLogger extends AbstractLogger {
  private alertServerLevel: LogLevel = 'warn';

  public logRaw(...text: string[]) {
    // eslint-disable-next-line
    console.log(...text);
  }

  public logRawError(...text: string[]) {
    // eslint-disable-next-line
    console.error(...text);
  }

  public logRawWarn(...text: string[]) {
    // eslint-disable-next-line
    console.warn(...text);
  }

  public log(
    level: LogLevel,
    message: string,
    method: (content: string) => void
  ) {
    super.log(level, message, method);
    if (this.meetsLogLevel(level, this.alertServerLevel)) {
      NetworkManager.sendEvent<ClientLogEvent>({
        type: 'ClientLogEvent',
        data: {
          level,
          date: Date.now(),
          message,
        },
      });
    }
  }
}
