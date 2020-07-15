import { AbstractLogger } from 'core/log';
import { LoggerWrapper } from 'core/log';
import { FileLogger } from 'core/log/file';

export class LogManager extends LoggerWrapper {
  public initialize(logger: AbstractLogger) {
    this.setLogger(logger);
    this.forFile(__filename).debug('LogManager initialized');
  }

  public forFile(fileName: string): AbstractLogger {
    const logger = new FileLogger(fileName);
    logger.setLogger(this);
    return logger;
  }
}
