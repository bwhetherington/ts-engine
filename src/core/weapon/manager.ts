import { Weapon, Pistol, Bomb } from 'core/weapon';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export class WeaponManager {
  private weaponConstructors: { [type: string]: new () => Weapon } = {};

  public registerWeapon(Type: (new () => Weapon) & typeof Weapon): void {
    const name = Type.typeName;
    this.weaponConstructors[name] = Type;
    log.trace(`weapon ${name} registered`);
  }

  private registerWeapons(): void {
    this.registerWeapon(Pistol);
    this.registerWeapon(Bomb);
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
