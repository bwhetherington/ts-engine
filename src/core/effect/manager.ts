import {LoadingManager} from 'core/assets';
import {Effect, IntervalEffect} from 'core/effect';
import {EventManager} from 'core/event';
import {UUID} from 'core/uuid';
import {DotEffect} from './dot';
import {DeleteEffectEvent, SpawnEffectEvent} from './effect';
import {ModifierEffect} from './modifier';

export class EffectManager extends LoadingManager<Effect> {
  private effects: Map<UUID, Effect> = new Map();

  constructor() {
    super('EffectManager');
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(Effect);
    this.registerAssetType(IntervalEffect);
    this.registerAssetType(DotEffect);
    this.registerAssetType(ModifierEffect);
    await this.loadAssetTemplates('templates/effects');
  }
}
