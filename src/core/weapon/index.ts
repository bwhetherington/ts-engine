import { WeaponManager } from 'core/weapon/manager';
import { Unit } from 'core/entity';
import { UUID } from 'core/uuid';

export * from 'core/weapon/weapon';
export * from 'core/weapon/gun';

export interface FireEvent {
  sourceID: UUID;
}

const manager = new WeaponManager();
export { manager as WeaponManager };
