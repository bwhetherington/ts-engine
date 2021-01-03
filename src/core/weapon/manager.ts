import {
  Weapon,
  BaseGun,
  BaseRayGun,
  BaseHomingGun,
  BaseBurstGun,
} from 'core/weapon';
import {LogManager} from 'core/log';
import {Template} from 'core/entity/template';
import {Iterator} from 'core/iterator';
import { AssetManager } from 'core/assets';

const log = LogManager.forFile(__filename);

export class WeaponManager {
  private weaponConstructors: Record<string, () => Weapon> = {};

  public registerWeapon(Type: (new () => Weapon) & typeof Weapon): void {
    const name = Type.typeName;
    this.weaponConstructors[name] = () => new Type();
    log.debug(`weapon ${name} registered`);
  }

  public registerTemplateWeapon(template: Template): void {
    const {type, extends: base} = template;
    const baseConstructor = this.weaponConstructors[base];
    const gen = () => {
      const entity = baseConstructor();
      entity.deserialize(template);
      return entity;
    };
    this.weaponConstructors[type] = gen;
    log.debug(`weapon template ${type} registered`);
  }

  private async registerWeapons(): Promise<void> {
    this.registerWeapon(BaseGun);
    this.registerWeapon(BaseRayGun);
    this.registerWeapon(BaseHomingGun);
    this.registerWeapon(BaseBurstGun);

    const weaponList = await AssetManager.loadJSON('templates/weapons/index.json') as string[];
    const weaponFiles = await AssetManager.loadAllJSON(weaponList);

    Iterator.from(weaponFiles)
      .filter((template) => typeof template.type === 'string')
      .map((template) => template as Template)
      .forEach((template) => {
        this.registerTemplateWeapon(template);
      });
  }

  public async initialize(): Promise<void> {
    await this.registerWeapons();
    log.debug('WeaponManager initialized');
  }

  public createWeapon(type: string): Weapon | undefined {
    const Type = this.weaponConstructors[type];
    if (Type) {
      return Type();
    } else {
      log.error('could not construct ' + type);
    }
  }
}
