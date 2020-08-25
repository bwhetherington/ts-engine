import { WeaponManager } from 'core/weapon/manager';
import { UUID } from 'core/uuid';

export * from 'core/weapon/weapon';
export * from 'core/weapon/gun';

export interface FireEvent {
  sourceID: UUID;
}

const manager = new WeaponManager();
export { manager as WeaponManager };
