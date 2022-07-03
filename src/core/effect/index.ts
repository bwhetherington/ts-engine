import {EffectManager as EM} from '@/core/effect/manager';
import {makeEventType} from '@/core/event';
import {UUID} from '@/core/uuid';

export * from '@/core/effect/effect';
export * from '@/core/effect/interval';
export * from '@/core/effect/dot';
export * from '@/core/effect/spawn';
export * from '@/core/effect/modifier';
export * from '@/core/effect/rush';
export * from '@/core/effect/burst';
export * from '@/core/effect/rupture';

export interface UpdateEffectCountEvent {
  targetID: UUID;
  effectCounts: Record<string, number>;
}
export const UpdateEffectCountEvent = makeEventType<UpdateEffectCountEvent>(
  'UpdateEffectCountEvent'
);

export const EffectManager = new EM();
