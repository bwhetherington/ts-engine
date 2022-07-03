import {LoadingManager} from '@/core/assets';
import {LogManager} from '@/core/log';
import {
  BaseBarrageGun,
  BaseGun,
  BaseHomingGun,
  BaseRaygun,
  Weapon,
} from '@/core/weapon';

const log = LogManager.forFile(__filename);

export class WeaponManager extends LoadingManager<Weapon> {
  constructor() {
    super('WeaponManager');
  }

  private async registerWeapons(): Promise<void> {
    this.registerAssetType(BaseGun);
    this.registerAssetType(BaseRaygun);
    this.registerAssetType(BaseHomingGun);
    this.registerAssetType(BaseBarrageGun);

    await this.loadAssetTemplates('templates/weapons');
  }

  public async initialize(): Promise<void> {
    await this.registerWeapons();
    log.debug('WeaponManager initialized');
  }
}
