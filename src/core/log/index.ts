import { LogLevel, AbstractLogger } from 'core/log/util';
import { LoggerWrapper } from 'core/log/wrapper';
import { LogManager } from 'core/log/manager';

export const LM = new LogManager();
export { LogLevel, AbstractLogger, LoggerWrapper };
