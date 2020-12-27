import BigProjectile from 'core/entity/template/BigProjectile.json';
import HeavyEnemy from 'core/entity/template/HeavyEnemy.json';
import HomingEnemy from 'core/entity/template/HomingEnemy.json';
import SniperHero from 'core/entity/template/SniperHero.json';
import MachineGunHero from 'core/entity/template/MachineGunHero.json';
import HeavyHero from 'core/entity/template/HeavyHero.json';
import {Data} from 'core/serialize';

export {BigProjectile, HeavyEnemy, HomingEnemy, SniperHero, MachineGunHero, HeavyHero};
export type Template = {type: string} & Data;
