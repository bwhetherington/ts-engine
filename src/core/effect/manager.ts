import {LoadingManager} from 'core/assets';
import {
  Effect,
  IntervalEffect,
  ModifierEffect,
  SpawnEffect,
  DotEffect,
} from 'core/effect';
import {UUID} from 'core/uuid';

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
    this.registerAssetType(SpawnEffect);
    await this.loadAssetTemplates('templates/effects');
  }
}
