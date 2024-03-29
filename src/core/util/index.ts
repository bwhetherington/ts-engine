import {makeEventType} from '@/core/event';

import {Queue, SizedQueue} from '@/core/util/queue';
import {TimerHandler, AbstractTimer, sleep} from '@/core/util/time';
import {diff} from '@/core/util/object';
import {Data} from '@/core/serialize';
import {StringBuffer} from '@/core/util/stringbuffer';

export function clamp(x: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, x));
}

// 3x^2 - 2x^3
// vvv
// 6x - 6x^2
export function smoothStep(x: number): number {
  return clamp(3 * x * x - 2 * x * x * x, 0, 1);
}

export function smoothStepDerivative(x: number): number {
  return 6 * x - 6 * x * x;
}

export function capitalize(word: string): string {
  if (word.length > 0) {
    const out = word.toLowerCase();
    return out[0].toUpperCase() + out.slice(1);
  } else {
    return word;
  }
}

export interface ToString {
  toString(): string;
}

export function formatData(data: Data): string {
  return new StringBuffer().formatData(data).toString();
}

export interface BarUpdateEvent {
  id: string;
  value?: number;
  maxValue?: number;
}
export const BarUpdateEvent = makeEventType<BarUpdateEvent>('BarUpdateEvent');

export {Queue, SizedQueue, TimerHandler, AbstractTimer, sleep, diff};

export * from '@/core/util/heap';
export * from '@/core/metrics';

export interface BufferData {
  toString(encoding?: BufferEncoding): string;
}

export type Empty = Record<string, never>;

// export * from '@/core/util/map';
