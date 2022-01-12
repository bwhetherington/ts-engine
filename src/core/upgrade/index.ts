export * from 'core/upgrade/upgrade';
export * from 'core/upgrade/modifier';
export * from 'core/upgrade/class';
export * from 'core/upgrade/aura';
export * from 'core/upgrade/effect';

import {Upgrade} from 'core/upgrade/upgrade';
import {BaseHero} from 'core/entity';
import {UUID} from 'core/uuid';

export interface ChangeStoredUpgradeCountEvent {
  storedUpgrades: number;
}

export interface RequestUpgradeEvent {
  hero: UUID;
}

export interface OfferUpgradeEvent {
  id: UUID;
  upgrades: string[];
}

export interface SelectUpgradeEvent {
  upgrade: string;
  hero: UUID;
  id: UUID;
}

export interface CloseOfferEvent {
  id: UUID;
}

export interface Offer {
  id: UUID;
  upgrades: string[];
}

export interface UpgradeEvent {
  hero: BaseHero;
  upgrade: Upgrade;
}

import {UpgradeManager} from 'core/upgrade/manager';
const UM = new UpgradeManager();
export {UM as UpgradeManager};
