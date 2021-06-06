import {LoadingManager} from 'core/assets';
import {EventManager} from 'core/event';
import {Player} from 'core/player';
import { RNGManager } from 'core/random';
import {OfferUpgradeEvent, SelectUpgradeEvent, Upgrade} from 'core/upgrade';
import {sleep} from 'core/util';
import {UUID, UUIDManager} from 'core/uuid';
import {Iterator} from 'core/iterator';
import {ModifierUpgrade} from './modifier';

interface Offer {
  id: UUID;
  upgrades: string[];
  reject(): void;
  resolve(choice: Upgrade): void;
}

const EXCLUDED_UPGRADES = ['ModifierUpgrade'];

export class UpgradeManager extends LoadingManager<Upgrade> {
  private offers: Record<UUID, Offer> = {};
  private availableUpgrades: string[] = [];

  constructor() {
    super('UpgradeManager');
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(ModifierUpgrade);
    await this.loadAssetTemplates('templates/upgrades');

    this.availableUpgrades = this.getAssetInitializers()
      .filter(([type, _initializer]) => !EXCLUDED_UPGRADES.includes(type))
      .map(([type, _initializer]) => type)
      .toArray();

    EventManager.streamEvents<SelectUpgradeEvent>('SelectUpgradeEvent')
      .filterMap(({data}) => {
        const offer = this.offers[data.id];
        if (offer) {
          return {offer, choice: data.upgrade};
        }
      })
      // Validate that they were offered the upgrade that they chose
      .filter(({offer, choice}) => offer.upgrades.includes(choice))
      .filterMap(({offer, choice}) => {
        const upgrade = this.instantiate(choice);
        if (upgrade) {
          return {offer, upgrade};
        }
      })
      .forEach(({offer, upgrade}) => {
        this.acceptOffer(offer.id, upgrade);
      });
  }

  private cleanupOffer(id: UUID, then: (offer: Offer) => void): void {
    const offer = this.offers[id];
    if (offer) {
      delete this.offers[id];
      UUIDManager.free(id);
      then(offer);
    }
  }

  private acceptOffer(id: UUID, choice: Upgrade): void {
    this.cleanupOffer(id, (offer) => offer.resolve(choice));
  }

  private rejectOffer(id: UUID): void {
    this.cleanupOffer(id, (offer) => offer.reject());
  }

  private sendUpgrades(player: Player, upgrades: string[]): Promise<Upgrade> {
    return new Promise(async (resolve, reject) => {
      const id = UUIDManager.generate();
      this.offers[id] = {
        id,
        upgrades,
        reject,
        resolve,
      };
      player.sendEvent<OfferUpgradeEvent>({
        type: 'OfferUpgradeEvent',
        data: {
          upgrades,
          id,
        },
      });

      // Timeout
      await sleep(60);
      if (this.offers.hasOwnProperty(id)) {
        this.rejectOffer(id);
      }
    });
  }

  public async offerUpgrades(
    player: Player,
    upgrades: string[]
  ): Promise<void> {
    try {
      const upgrade = await this.sendUpgrades(player, upgrades);
      if (player.hero) {
        upgrade.applyTo(player.hero);
      }
    } catch (_ex) {}
  }

  public sampleUpgrades(): Iterator<string> {
    
    return RNGManager
      .sample(this.availableUpgrades);
  }
}
