import { now, Timer } from 'server/util/Timer';
import { ServerLogger } from 'server/util/ServerLogger';
import { TimerManager } from './TimerManager';

const TM = new TimerManager();
export { TM as TimerManager, now, Timer, ServerLogger };
