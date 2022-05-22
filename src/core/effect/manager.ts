import {LoadingManager} from '@/core/assets';
import {
  Effect,
  IntervalEffect,
  ModifierEffect,
  SpawnEffect,
  DotEffect,
  RushEffect,
  BurstEffect,
  RuptureEffect,
} from '@/core/effect';
import {UUID} from '@/core/uuid';

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
    this.registerAssetType(RushEffect);
    this.registerAssetType(BurstEffect);
    this.registerAssetType(RuptureEffect);
    await this.loadAssetTemplates('templates/effects');
  }
}
