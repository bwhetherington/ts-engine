import {Weapon, BaseGun, BaseRaygun, BaseHomingGun} from 'core/weapon';
import {LogManager} from 'core/log';
import {AssetTemplate, LoadingManager} from 'core/assets';
import {Iterator} from 'core/iterator';
import {AssetManager} from 'core/assets';

const log = LogManager.forFile(__filename);

export class WeaponManager extends LoadingManager<Weapon> {
  constructor() {
    super('WeaponManager');
  }

  private async registerWeapons(): Promise<void> {
    this.registerAssetType(BaseGun);
    this.registerAssetType(BaseRaygun);
    this.registerAssetType(BaseHomingGun);

    await this.loadAssetTemplates('templates/weapons');
  }

  public async initialize(): Promise<void> {
    await this.registerWeapons();
    log.debug('WeaponManager initialized');
  }
}
