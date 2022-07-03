import {LogManager} from '@/core/log/manager';
import {AbstractLogger, LogLevel} from '@/core/log/util';
import {LoggerWrapper} from '@/core/log/wrapper';
import {UUID} from '@/core/uuid';

export interface ClientLogEvent {
  playerID?: UUID;
  level: LogLevel;
  date: number;
  message: string;
}

const LM = new LogManager();
export {LM as LogManager, LogLevel, AbstractLogger, LoggerWrapper};
