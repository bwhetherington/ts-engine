import {AbstractLogger, LogLevel} from 'core/log';

export class LoggerWrapper extends AbstractLogger {
  protected logger?: AbstractLogger;

  public setLogger(logger: AbstractLogger) {
    this.logger = logger;
  }

  public override setLogLevel(level: LogLevel) {
    this.logger?.setLogLevel(level);
  }

  public override getLogLevel(): LogLevel {
    return this.logger?.getLogLevel() ?? 'trace';
  }

  public override getPriority(): number {
    return this.logger?.getPriority() ?? 4;
  }

  public logRaw(content: string) {
    this.logger?.logRaw(content);
  }
}
