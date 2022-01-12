export * from 'core/effect/effect';
export * from 'core/effect/interval';
export * from 'core/effect/dot';
export * from 'core/effect/spawn';
export * from 'core/effect/modifier';

import {EffectManager as EM} from 'core/effect/manager';
export const EffectManager = new EM();
