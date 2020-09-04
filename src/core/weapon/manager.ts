import { Weapon, Gun, RayGun } from 'core/weapon';
import { LogManager } from 'core/log';
import { Template } from 'core/entity/template';
import { MachineGun, HeavyGun, SniperGun } from 'core/weapon/template';

const log = LogManager.forFile(__filename);

export class WeaponManager {
  private weaponConstructors: Record<string, () => Weapon> = {};

  public registerWeapon(Type: (new () => Weapon) & typeof Weapon): void {
    const name = Type.typeName;
    this.weaponConstructors[name] = () => new Type();
    log.trace(`weapon ${name} registered`);
  }

  public registerTemplateWeapon(template: Template): void {
    const { type, extends: base } = template;
    const baseConstructor = this.weaponConstructors[base];
    const gen = () => {
      const entity = baseConstructor();
      entity.deserialize(template);
      return entity;
    };
    this.weaponConstructors[type] = gen;
    log.trace(`template weapon ${type} registered`);
  }

  private registerWeapons(): void {
    this.registerWeapon(Gun);
    this.registerWeapon(RayGun);

    // Register template weapons
    this.registerTemplateWeapon(MachineGun);
    this.registerTemplateWeapon(HeavyGun);
    this.registerTemplateWeapon(SniperGun);

    // this.registerWeapon(Bomb);
    // this.registerWeapon(MachineGun);
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
