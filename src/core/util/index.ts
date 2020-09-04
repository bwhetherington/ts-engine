import { Queue, SizedQueue } from 'core/util/queue';
import { TimerHandler, AbstractTimer, sleep } from 'core/util/time';
import { diff } from 'core/util/object';

export function clamp(x: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, x));
}

export function smoothStep(x: number): number {
  return clamp(3 * x * x - 2 * x * x * x, 0, 1);
}

interface BarUpdateEvent {
  id: string;
  value?: number;
  maxValue?: number;
}

export {
  BarUpdateEvent,
  Queue,
  SizedQueue,
  TimerHandler,
  AbstractTimer,
  sleep,
  diff,
};
