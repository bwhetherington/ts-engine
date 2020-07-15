import { AbstractLogger } from 'core/log';

export class LoggerWrapper extends AbstractLogger {
  protected logger?: AbstractLogger;

  public setLogger(logger: AbstractLogger): void {
    this.logger = logger;
  }

  public logRaw(content: string) {
    this.logger?.logRaw(content);
  }
}
