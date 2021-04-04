import {AbstractLogger, LogLevel} from 'core/log';

export class LoggerWrapper extends AbstractLogger {
  protected logger?: AbstractLogger;

  public setLogger(logger: AbstractLogger): void {
    this.logger = logger;
  }

  public override setLogLevel(level: LogLevel): void {
    this.logger?.setLogLevel(level);
  }

  public override getLogLevel(): LogLevel {
    return this.logger?.getLogLevel() ?? 'trace';
  }

  public override getPriority(): number {
    return this.logger?.getPriority() ?? 4;
  }

  public override logRaw(content: string): void {
    this.logger?.logRaw(content);
  }
}
