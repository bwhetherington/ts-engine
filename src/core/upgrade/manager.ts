import {LoadingManager} from 'core/assets';
import {EventManager} from 'core/event';
import {Player} from 'core/player';
import {RNGManager} from 'core/random';
import {
  AuraUpgrade,
  Offer,
  OfferUpgradeEvent,
  SelectUpgradeEvent,
  Upgrade,
  ModifierUpgrade,
  ClassUpgrade,
  CloseOfferEvent,
  RequestUpgradeEvent,
} from 'core/upgrade';
import {sleep} from 'core/util';
import {UUID, UUIDManager} from 'core/uuid';
import {Iterator} from 'core/iterator';
import {BaseHero, WorldManager} from 'core/entity';
import {NetworkManager} from 'core/net';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

interface OfferEntry extends Offer {
  hero: UUID;
  reject(): void;
  resolve(choice: UpgradeSelection): void;
}

interface UpgradeSelection {
  upgrade: Upgrade;
  hero: UUID;
}

const EXCLUDED_UPGRADES = new Set([
  'ModifierUpgrade',
  'ClassUpgrade',
  'AuraUpgrade',
]);

// const CLASS_UPGRADES = new Set(['MachineGun', 'Homing', 'Railgun', 'Laser']);

export class UpgradeManager extends LoadingManager<Upgrade> {
  private offers: Map<UUID, Offer> = new Map();
  private availableUpgrades: string[] = [];

  constructor() {
    super('UpgradeManager');
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(ModifierUpgrade);
    this.registerAssetType(ClassUpgrade);
    this.registerAssetType(AuraUpgrade);
    await this.loadAssetTemplates('templates/upgrades');

    this.availableUpgrades = this.getAssetInitializers()
      .filter(
        ([type]) =>
          !(
            EXCLUDED_UPGRADES.has(type)
          )
      )
      .map(([type, _initializer]) => type)
      .toArray();

    if (NetworkManager.isServer()) {
      EventManager.streamEventsForPlayer<RequestUpgradeEvent>('RequestUpgradeEvent')
        .filterMap(({player, data: {hero}}) => {
          const entity = WorldManager.getEntity(hero);
          if (entity instanceof BaseHero) {
            return {player, hero: entity};
          }
        })
        .filter(({hero}) => hero.storedUpgrades > 0)
        .forEach(({player, hero}) => {
          hero.storedUpgrades -= 1;
          const id = UUIDManager.generate();
          const upgrades = this.sampleUpgrades(hero).take(3).toArray();
          this.offers.set(id, {
            id, upgrades,
          });
          NetworkManager.sendEvent<OfferUpgradeEvent>({
            type: 'OfferUpgradeEvent',
            data: {
              id,
              upgrades,
            },
          }, player.socket);
        });

      EventManager.streamEventsForPlayer<SelectUpgradeEvent>(
        'SelectUpgradeEvent'
      ).forEach(({data: {id, upgrade, hero}}) => {
        const offer = this.offers.get(id);
        if (!offer) {
          log.error('offer not found: ' + id);
          this.closeOffer(id);
          return;
        }

        if (!offer.upgrades.includes(upgrade)) {
          log.error('selected upgrade was not valid for offer');
          this.closeOffer(id);
          return;
        }

        const heroEntity = WorldManager.getEntity(hero);
        if (!(heroEntity instanceof BaseHero)) {
          log.error('hero not found');
          this.closeOffer(id);
          return;
        }

        const instantiated = this.instantiate(upgrade);
        if (!instantiated) {
          log.error('failed to instantiate upgrade: ' + upgrade);
          this.closeOffer(id);
          return;
        }

        heroEntity.applyUpgrade(instantiated);
        this.closeOffer(id);
      });
    }
  }

  private closeOffer(id: UUID) {
    UUIDManager.free(id);
    if (this.offers.delete(id)) {
      NetworkManager.sendEvent<CloseOfferEvent>({
        type: 'CloseOfferEvent',
        data: {id},
      });
    }
  }

  public sampleUpgrades(hero: BaseHero): Iterator<string> {
    console.log({
      upgrades: [...hero.upgrades],
    });
    return RNGManager.sample(this.availableUpgrades).filter((type) => {
      console.log('consider: ' + type);

      // Exclude upgrades which do not exist
      const upgrade = this.instantiate(type);
      if (!upgrade) {
        return false;
      }

      // Exclude upgrades for which we do not have the necessary upgrades
      if (upgrade.requires.some((requirement) => !hero.upgrades.includes(requirement))) {
        console.log(`reject ${type} for lack of requirements: ${[...upgrade.requires]}`);
        return false;
      }

      // Exclude upgrades which are exclusive with upgrades we already have
      if (upgrade.exclusiveWith.some((exclusive) => hero.upgrades.includes(exclusive))) {
        console.log(`reject ${type} for conflict`);
        return false;
      }

      // Exclude unique upgrades if the player already has them selected
      if (upgrade.isUnique) {
        if (hero && hero.upgrades.includes(upgrade.type)) {
          return false;
        }
      }

      return true;
    });
  }
}
