import {AbstractLogger, ClientLogEvent, LogLevel} from 'core/log';
import {NetworkManager} from 'core/net';

export class ClientLogger extends AbstractLogger {
  private alertServerLevel: LogLevel = 'warn';

  public logRaw(...text: string[]): void {
    console.log(...text);
  }

  public override logRawError(...text: string[]): void {
    console.error(...text);
  }

  public override logRawWarn(...text: string[]): void {
    console.warn(...text);
  }

  public override log(
    level: LogLevel,
    message: string,
    method: (content: string) => void
  ): void {
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
