export * from '@/core/upgrade/upgrade';
export * from '@/core/upgrade/modifier';
export * from '@/core/upgrade/class';
export * from '@/core/upgrade/aura';
export * from '@/core/upgrade/effect';

import {Upgrade} from '@/core/upgrade/upgrade';
import {BaseHero} from '@/core/entity';
import {UUID} from '@/core/uuid';
import {makeEventType} from '@/core/event';

export interface ChangeStoredUpgradeCountEvent {
  storedUpgrades: number;
}
export const ChangeStoredUpgradeCountEvent =
  makeEventType<ChangeStoredUpgradeCountEvent>('ChangeStoredUpgradeCountEvent');

export interface RequestUpgradeEvent {
  hero: UUID;
}
export const RequestUpgradeEvent = makeEventType<RequestUpgradeEvent>(
  'RequestUpgradeEvent'
);

export interface OfferUpgradeEvent {
  id: UUID;
  upgrades: string[];
}
export const OfferUpgradeEvent =
  makeEventType<OfferUpgradeEvent>('OfferUpgradeEvent');

export interface SelectUpgradeEvent {
  upgrade: string;
  hero: UUID;
  id: UUID;
}
export const SelectUpgradeEvent =
  makeEventType<SelectUpgradeEvent>('SelectUpgradeEvent');

export interface CloseOfferEvent {
  id: UUID;
}
export const CloseOfferEvent =
  makeEventType<CloseOfferEvent>('CloseOfferEvent');

export interface Offer {
  id: UUID;
  upgrades: string[];
}

export interface UpgradeEvent {
  hero: BaseHero;
  upgrade: Upgrade;
}
export const UpgradeEvent = makeEventType<UpgradeEvent>('UpgradeEvent');

import {UpgradeManager} from '@/core/upgrade/manager';
const UM = new UpgradeManager();
export {UM as UpgradeManager};
