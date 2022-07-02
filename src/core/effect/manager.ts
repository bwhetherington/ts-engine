import {AssetTemplate, LoadingManager} from '@/core/assets';
import {
  Effect,
  IntervalEffect,
  ModifierEffect,
  SpawnEffect,
  DotEffect,
  RushEffect,
  BaseBurstEffect,
  BaseRuptureEffect,
} from '@/core/effect';

interface EffectInfo {
  isBoon: boolean;
}

export class EffectManager extends LoadingManager<Effect> {
  private effectInfo: Map<string, EffectInfo> = new Map();

  constructor() {
    super('EffectManager');
  }

  public getInfo(type: string): EffectInfo | undefined {
    return this.effectInfo.get(type);
  }

  protected override registerAssetTemplate(template: AssetTemplate): void {
    this.effectInfo.set(template.type, {
      isBoon: template.isBoon ?? false,
    });
    super.registerAssetTemplate(template);
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(Effect);
    this.registerAssetType(IntervalEffect);
    this.registerAssetType(DotEffect);
    this.registerAssetType(ModifierEffect);
    this.registerAssetType(SpawnEffect);
    this.registerAssetType(RushEffect);
    this.registerAssetType(BaseBurstEffect);
    this.registerAssetType(BaseRuptureEffect);
    await this.loadAssetTemplates('templates/effects');
  }
}
