import { AbstractLogger } from 'core/log/util';

class LogManager extends AbstractLogger {
  private logger?: AbstractLogger;

  public initialize(logger: AbstractLogger) {
    this.logger = logger;
    this.debug('LogManager initialized');
  }

  public logRaw(content: string) {
    this.logger?.logRaw(content);
  }

  public error(msg: string) {
    this.logger?.error(msg);
  }

  public warn(msg: string) {
    this.logger?.warn(msg);
  }

  public info(msg: string) {
    this.logger?.info(msg);
  }

  public debug(msg: string) {
    this.logger?.debug(msg);
  }
}

export const LM = new LogManager();
