import { Timer } from 'server/util/Timer';
import { ServerLogger } from 'server/util/ServerLogger';
import { TimerManager } from './TimerManager';

export const TM = new TimerManager();
export { Timer, ServerLogger };
