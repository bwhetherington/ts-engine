import { LogLevel, AbstractLogger } from 'core/log/util';
import { LoggerWrapper } from 'core/log/wrapper';
import { LogManager } from 'core/log/manager';

const LM = new LogManager();
export { LM as LogManager, LogLevel, AbstractLogger, LoggerWrapper };
