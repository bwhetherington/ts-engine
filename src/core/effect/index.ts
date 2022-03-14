export * from '@/core/effect/effect';
export * from '@/core/effect/interval';
export * from '@/core/effect/dot';
export * from '@/core/effect/spawn';
export * from '@/core/effect/modifier';
export * from '@/core/effect/rush';

import {UUID} from '@/core/uuid';

export interface UpdateEffectCountEvent {
  targetID: UUID;
  effectCounts: Record<string, number>;
}

import {EffectManager as EM} from '@/core/effect/manager';
export const EffectManager = new EM();
