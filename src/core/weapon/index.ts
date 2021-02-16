import {WeaponManager} from 'core/weapon/manager';
import {UUID} from 'core/uuid';

export * from 'core/weapon/weapon';
export * from 'core/weapon/gun';
export * from 'core/weapon/raygun';
export * from 'core/weapon/homing';

export interface FireEvent {
  sourceID: UUID;
  cannonIndex: number;
}

const manager = new WeaponManager();
export {manager as WeaponManager};
