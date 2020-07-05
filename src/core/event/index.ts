import { EventManager, StepEvent } from 'core/event/EventManager';
import { GameEvent, EventData, isEvent } from 'core/event/util';

export const EM = new EventManager();
export { GameEvent, EventData, StepEvent, isEvent };
