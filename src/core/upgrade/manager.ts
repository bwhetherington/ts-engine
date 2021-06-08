import {LoadingManager} from 'core/assets';
import {EventManager} from 'core/event';
import {Player} from 'core/player';
import {RNGManager} from 'core/random';
import {
  Offer,
  OfferUpgradeEvent,
  SelectUpgradeEvent,
  Upgrade,
  ModifierUpgrade,
  ClassUpgrade,
} from 'core/upgrade';
import {sleep} from 'core/util';
import {UUID, UUIDManager} from 'core/uuid';
import {Iterator} from 'core/iterator';

interface OfferEntry extends Offer {
  hero: UUID;
  reject(): void;
  resolve(choice: UpgradeSelection): void;
}

interface UpgradeSelection {
  upgrade: Upgrade;
  hero: UUID;
}

const EXCLUDED_UPGRADES = new Set(['ModifierUpgrade', 'ClassUpgrade']);

const CLASS_UPGRADES = new Set(['MachineGun', 'Homing', 'Railgun', 'Laser']);

export class UpgradeManager extends LoadingManager<Upgrade> {
  private offers: Record<UUID, OfferEntry> = {};
  private availableUpgrades: string[] = [];
  private availableHeroUpgrades: string[] = [...CLASS_UPGRADES];

  constructor() {
    super('UpgradeManager');
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(ModifierUpgrade);
    this.registerAssetType(ClassUpgrade);
    await this.loadAssetTemplates('templates/upgrades');

    this.availableUpgrades = this.getAssetInitializers()
      .filter(
        ([type, initializer]) =>
          !(
            EXCLUDED_UPGRADES.has(type) || initializer() instanceof ClassUpgrade
          )
      )
      .map(([type, _initializer]) => type)
      .toArray();

    this.availableHeroUpgrades = this.getAssetInitializers()
      .filter(
        ([type, initializer]) =>
          !EXCLUDED_UPGRADES.has(type) && initializer() instanceof ClassUpgrade
      )
      .map(([type, _initializer]) => type)
      .toArray();

    EventManager.streamEventsForPlayer<SelectUpgradeEvent>('SelectUpgradeEvent')
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

  private cleanupOffer(id: UUID, then: (offer: OfferEntry) => void): void {
    const offer = this.offers[id];
    if (offer) {
      delete this.offers[id];
      UUIDManager.free(id);
      then(offer);
    }
  }

  private acceptOffer(id: UUID, choice: Upgrade): void {
    this.cleanupOffer(id, (offer) =>
      offer.resolve({
        hero: offer.hero,
        upgrade: choice,
      })
    );
  }

  private rejectOffer(id: UUID): void {
    this.cleanupOffer(id, (offer) => offer.reject());
  }

  private sendUpgrades(
    player: Player,
    upgrades: string[]
  ): Promise<UpgradeSelection> {
    return new Promise(async (resolve, reject) => {
      if (upgrades.length === 0) {
        reject();
        return;
      }

      const id = UUIDManager.generate();
      const hero = player.hero?.id;
      if (!hero) {
        reject();
        return;
      }
      this.offers[id] = {
        id,
        hero,
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
      const {hero: oldHero} = player;
      const {hero, upgrade} = await this.sendUpgrades(player, upgrades);
      const {hero: newHero} = player;
      if (
        oldHero &&
        newHero &&
        newHero.id === oldHero.id &&
        oldHero.id === hero
      ) {
        newHero.applyUpgrade(upgrade);
      }
    } catch (_ex) {}
  }

  public sampleUpgrades(): Iterator<string> {
    return RNGManager.sample(this.availableUpgrades);
  }

  public sampleHeroUpgrades(): Iterator<string> {
    return RNGManager.sample(this.availableHeroUpgrades);
  }
}
