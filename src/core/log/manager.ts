import {AbstractLogger, LogLevel} from '@/core/log';
import {LoggerWrapper} from '@/core/log';
import {FileLogger} from '@/core/log/file';

export class LogManager extends LoggerWrapper {
  public initialize(level: LogLevel, logger: AbstractLogger) {
    this.setLogger(logger);
    this.setLogLevel(level);
    this.forFile(__filename).debug('LogManager initialized');
  }

  public forFile(fileName: string): AbstractLogger {
    const logger = new FileLogger(fileName);
    logger.setLogger(this);
    logger.setLogLevel(this.getLogLevel());
    return logger;
  }
}
