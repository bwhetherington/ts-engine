import { WeaponManager } from './manager';

export * from 'core/weapon/weapon';
export * from 'core/weapon/pistol';

const manager = new WeaponManager();
export { manager as WeaponManager };
