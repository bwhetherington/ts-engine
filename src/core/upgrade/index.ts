export * from 'core/upgrade/upgrade';
export * from 'core/upgrade/modifier';
import {UUID} from 'core/uuid';

export interface OfferUpgradeEvent {
  upgrades: string[];
  id: UUID;
}

export interface SelectUpgradeEvent {
  upgrade: string;
  id: UUID;
}

import {UpgradeManager} from 'core/upgrade/manager';
const UM = new UpgradeManager();
export {UM as UpgradeManager};
