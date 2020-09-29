import { Queue, SizedQueue } from 'core/util/queue';
import { TimerHandler, AbstractTimer, sleep } from 'core/util/time';
import { diff } from 'core/util/object';

export function clamp(x: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, x));
}

export function smoothStep(x: number): number {
  return clamp(3 * x * x - 2 * x * x * x, 0, 1);
}

export function capitalize(word: string): string {
  if (word.length > 0) {
    const out = word.toLowerCase();
    return out[0].toUpperCase() + out.slice(1);
  } else {
    return word;
  }
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
