import { AbstractLogger, LogLevel } from 'core/log';

export class LoggerWrapper extends AbstractLogger {
  protected logger?: AbstractLogger;

  public setLogger(logger: AbstractLogger): void {
    this.logger = logger;
  }

  public setLogLevel(level: LogLevel): void {
    this.logger?.setLogLevel(level);
  }

  public getLogLevel(): LogLevel {
    return this.logger?.getLogLevel() ?? 'trace';
  }

  public getPriority(): number {
    return this.logger?.getPriority() ?? 4;
  }

  public logRaw(content: string): void {
    this.logger?.logRaw(content);
  }
}
