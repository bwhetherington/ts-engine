import {LoadingManager} from '@/core/assets';
import {EventManager} from '@/core/event';
import {RNGManager} from '@/core/random';
import {
  AuraUpgrade,
  Offer,
  OfferUpgradeEvent,
  SelectUpgradeEvent,
  Upgrade,
  ModifierUpgrade,
  EffectUpgrade,
  ClassUpgrade,
  CloseOfferEvent,
  RequestUpgradeEvent,
} from '@/core/upgrade';
import {UUID, UUIDManager} from '@/core/uuid';
import {Iterator} from '@/core/iterator';
import {BaseHero, WorldManager} from '@/core/entity';
import {NetworkManager} from '@/core/net';
import {LogManager} from '@/core/log';

const log = LogManager.forFile(__filename);

const EXCLUDED_UPGRADES = new Set([
  'ModifierUpgrade',
  'ClassUpgrade',
  'AuraUpgrade',
  'EffectUpgrade',
]);

// const CLASS_UPGRADES = new Set(['MachineGun', 'Homing', 'Railgun', 'Laser']);

const RARE_MODIFIER = 0.5;

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
    this.registerAssetType(EffectUpgrade);
    await this.loadAssetTemplates('templates/upgrades');

    this.availableUpgrades = this.getAssetInitializers()
      .filter(([type]) => !EXCLUDED_UPGRADES.has(type))
      .map(([type, _initializer]) => type)
      .toArray();

    if (NetworkManager.isServer()) {
      EventManager.streamEventsForPlayer<RequestUpgradeEvent>(
        'RequestUpgradeEvent'
      )
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
            id,
            upgrades,
          });
          NetworkManager.sendEvent<OfferUpgradeEvent>(
            {
              type: 'OfferUpgradeEvent',
              data: {
                id,
                upgrades,
              },
            },
            player.socket
          );
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
    return RNGManager.sample(this.availableUpgrades).filter((type) => {
      // Exclude upgrades which do not exist
      const upgrade = this.instantiate(type);
      if (!upgrade) {
        return false;
      }

      // Exclude rare upgrades some of the time to make them occur less
      // frequently
      if (upgrade.isRare && RNGManager.nextBoolean(RARE_MODIFIER)) {
        return false;
      }

      // Exclude class upgrades of a tier the player has already reached
      if (upgrade instanceof ClassUpgrade && upgrade.tier <= hero.classTier) {
        return false;
      }

      // Exclude upgrades for which we do not have the necessary upgrades
      if (
        upgrade.requires.some(
          (requirement) => !hero.upgrades.includes(requirement)
        )
      ) {
        return false;
      }

      // Exclude upgrades which are exclusive with upgrades we already have
      if (
        upgrade.exclusiveWith.some((exclusive) =>
          hero.upgrades.includes(exclusive)
        )
      ) {
        return false;
      }

      // Exclude unique upgrades if the player already has them selected
      if (!upgrade.isRepeatable) {
        if (hero && hero.upgrades.includes(upgrade.type)) {
          return false;
        }
      }

      return true;
    });
  }
}
