import {Entity, CollisionLayer} from 'core/entity';
import {sleep, clamp, smoothStep} from 'core/util';
import {StepEvent} from 'core/event';
import {GraphicsContext} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {NetworkManager} from 'core/net';

const DURATION = 0.5;

export enum EchoVariant {
  Grow,
  Shrink,
}

export class AnimationEffect extends Entity {
  public static typeName: string = 'AnimationEffect';

  public constructor() {
    super();
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;
  }

  public shouldDeleteIfOffscreen(): boolean {
    return true;
  }
}
