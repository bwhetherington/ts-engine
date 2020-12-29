import {Weapon, BaseGun, BaseRayGun, BaseHomingGun, BaseBurstGun} from 'core/weapon';
import {LogManager} from 'core/log';
import {Template} from 'core/entity/template';
import * as templateGuns from 'core/weapon/template';
import { Iterator } from 'core/iterator';

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

  private registerWeapons(): void {
    this.registerWeapon(BaseGun);
    this.registerWeapon(BaseRayGun);
    this.registerWeapon(BaseHomingGun);
    this.registerWeapon(BaseBurstGun);

    // Register template weapons
    Iterator.values(templateGuns)
      .forEach(this.registerTemplateWeapon.bind(this));
  }

  public initialize(): void {
    this.registerWeapons();
    log.debug('WeaponManager initialized');
  }

  public createWeapon(type: string): Weapon | undefined {
    const Type = this.weaponConstructors[type];
    if (Type) {
      return Type();
    }
  }
}
