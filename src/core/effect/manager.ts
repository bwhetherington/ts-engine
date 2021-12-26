import {LoadingManager} from 'core/assets';
import {Effect, IntervalEffect} from 'core/effect';
import {DotEffect} from './dot';
import {ModifierEffect} from './modifier';

export class EffectManager extends LoadingManager<Effect> {
  constructor() {
    super('EffectManager');
  }

  public async initialize(): Promise<void> {
    console.log('foo');
    this.registerAssetType(Effect);
    this.registerAssetType(IntervalEffect);
    this.registerAssetType(DotEffect);
    this.registerAssetType(ModifierEffect);
    await this.loadAssetTemplates('templates/effects');
    console.log(this);
    console.log('EffectManager initialized');
  }
}
