import {makeEventType} from '@/core/event';

export * from '@/core/effect/effect';
export * from '@/core/effect/interval';
export * from '@/core/effect/dot';
export * from '@/core/effect/spawn';
export * from '@/core/effect/modifier';
export * from '@/core/effect/rush';
export * from '@/core/effect/burst';
export * from '@/core/effect/rupture';

import {UUID} from '@/core/uuid';

export interface UpdateEffectCountEvent {
  targetId: UUID;
  effectCounts: Record<string, number>;
}
export const UpdateEffectCountEvent = makeEventType<UpdateEffectCountEvent>(
  'UpdateEffectCountEvent'
);

import {EffectManager as EM} from '@/core/effect/manager';
export const EffectManager = new EM();
