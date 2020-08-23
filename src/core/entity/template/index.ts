import BigProjectile from 'core/entity/template/BigProjectile.json';
import HeavyEnemy from 'core/entity/template/HeavyEnemy.json';
import Feed from 'core/entity/template/Feed.json';
import SniperHero from 'core/entity/template/SniperHero.json';
import { Data } from 'core/serialize';

export { BigProjectile, Feed, HeavyEnemy, SniperHero };
export type Template = { type: string } & Data;