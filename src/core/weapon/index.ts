import {makeEventType} from '@/core/event';

import {WeaponManager} from '@/core/weapon/manager';
import {UUID} from '@/core/uuid';

export * from '@/core/weapon/weapon';
export * from '@/core/weapon/gun';
export * from '@/core/weapon/raygun';
export * from '@/core/weapon/homing';
export * from '@/core/weapon/barrage';

export interface FireEvent {
  sourceId: UUID;
  cannonIndex: number;
}
export const FireEvent = makeEventType<FireEvent>('FireEvent');

const manager = new WeaponManager();
export {manager as WeaponManager};
