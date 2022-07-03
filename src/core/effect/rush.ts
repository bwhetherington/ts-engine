import {Effect, EffectManager} from '@/core/effect';
import {KillEvent, Unit, WorldManager} from '@/core/entity';

import {ModifierEffect} from './modifier';

export class RushEffect extends Effect {
  public static typeName: string = 'RushEffect';

  public override onStart() {
    this.streamEvents(KillEvent)
      .filter((event) => event.data.sourceID === this.target?.id)
      .filterMap((event) => {
        const target = WorldManager.getEntity(event.data.targetID);
        if (target instanceof Unit) {
          return target;
        }
      })
      .filter((target) => target.getXPWorth() > 0)
      .forEach(() => {
        const buff = EffectManager.instantiate(
          'ModifierEffect'
        ) as ModifierEffect;
        buff.modifiers.set('damage', 0.2);
        buff.modifiers.set('speed', 0.2);
        buff.duration = 10;
        this.target?.addEffect(buff);
      });
  }
}
