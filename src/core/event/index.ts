import { EventManager, StepEvent } from 'core/event/manager';
import {
  Handler,
  GameHandler,
  GameEvent,
  Event,
  EventData,
  isEvent,
} from 'core/event/util';

export const EM = new EventManager();
export {
  Handler,
  GameHandler,
  GameEvent,
  Event,
  EventData,
  StepEvent,
  isEvent,
};
