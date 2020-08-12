import { Weapon, Pistol } from 'core/weapon';
import { LM } from 'core/log';

const log = LM.forFile(__filename);

export class WeaponManager {
  private weaponConstructors: { [type: string]: new () => Weapon } = {};

  public registerWeapon(Type: (new () => Weapon) & typeof Weapon): void {
    const name = Type.typeName;
    this.weaponConstructors[name] = Type;
    log.debug(`weapon ${name} registered`);
  }

  private registerWeapons(): void {
    this.registerWeapon(Pistol);
  }

  public initialize(): void {
    this.registerWeapons();
    log.debug('WeaponManager initialized');
  }

  public createWeapon(type: string): Weapon | undefined {
    const Type = this.weaponConstructors[type];
    if (Type) {
      return new Type();
    }
  }
}
