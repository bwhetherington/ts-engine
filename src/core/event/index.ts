import { EventManager, StepEvent } from 'core/event/EventManager';
import { GameEvent, Event, EventData, isEvent } from 'core/event/util';

export const EM = new EventManager();
export { GameEvent, Event, EventData, StepEvent, isEvent };
