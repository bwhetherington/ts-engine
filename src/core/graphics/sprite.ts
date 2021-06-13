import {Data, Serializable} from 'core/serialize';
import {Animation, Renderable, GameImage, GraphicsContext} from 'core/graphics';
import {Vector} from 'core/geometry';
import {AssetManager} from 'core/assets';
import { Iterator } from 'core/iterator';
import { AnimationMap } from './animation';
import { loadImage } from './image';

const ANIM_RATE = 1 / 16;

type ValueOrFunction<T> = T | (() => T);

interface AnimateOptions {
  animation: string;
  repeat?: ValueOrFunction<boolean>;
  next?: ValueOrFunction<AnimateOptions>;
}

export class Sprite implements Serializable, Renderable {
  private image?: GameImage;
  private source: string = '';
  private frameSize: Vector = new Vector(0, 0);
  private size: Vector = new Vector(0, 0);
  private animations: AnimationMap = new AnimationMap();
  private animDelay: number = 0;
  private currentAnimation?: Animation;
  private animateOptions: AnimateOptions = {
    animation: 'stand',
    repeat: true,
  };

  public async setSource(source: string): Promise<void> {
    this.source = source;
    delete this.image;
    this.image = await AssetManager.loadImage(source);
  }

  private get animation(): string {
    return this.animateOptions.animation;
  }

  private get animateRepeat(): boolean {
    const doRepeat = this.animateOptions.repeat;
    if (typeof doRepeat === 'function') {
      return doRepeat();
    } else {
      return !!doRepeat;
    }
  }

  private get animateNext(): AnimateOptions | undefined {
    const next = this.animateOptions.next;
    if (typeof next === 'function') {
      return next();
    } else {
      return next;
    }
  }

  public step(dt: number): void {
    this.animDelay += dt;
    while (this.animDelay >= ANIM_RATE) {
      if ((this.image?.height ?? 0) == 24) {
        console.log(this.animateOptions, this.currentAnimation?.frames);
      }
      this.animDelay -= ANIM_RATE;
      const isComplete = this.currentAnimation?.step();
      if (isComplete) {
        const doRepeat = this.animateRepeat;
        if (doRepeat) {
          // console.log('repeat');
          this.currentAnimation?.reset();
        } else {
          // console.log('next anim');
          const nextAnim = this.animateNext;
          if (nextAnim) {
            this.playAnimation(nextAnim);
          }
        }
      }
    }
  }

  public serialize(): Data {
    return {
      image: this.source,
      size: this.size.serialize(),
      frameSize: this.frameSize.serialize(),
      animations: this.animations.serialize(),
      animation: this.animation,
    };
  }

  public playAnimation(options: AnimateOptions): void {
    const anim = this.animations.get(options.animation);
    if (!anim) {
      return;
    }
    this.currentAnimation = anim;
    this.animateOptions = options;
    anim.reset();

  }

  private getAnimationFrame(): number | undefined {
    return this.currentAnimation?.getFrame();
  }

  public deserialize(data: Data, _initialize?: boolean): void {
    const {image, size, frameSize, animations, animation} = data;

    if (typeof image === 'string') {
      this.setSource(image);
    }

    if (size) {
      this.size.deserialize(size);
    }

    if (frameSize) {
      this.frameSize.deserialize(frameSize);
    }

    if (animations) {
      this.animations.deserialize(animations);
    }
  }

  public render(ctx: GraphicsContext): void {
    if (!this.image) {
      return;
    }

    // Compute coordinates of subimage
    const {width} = this.image;
    const {x: frameWidth, y: frameHeight} = this.frameSize;
    const {x: dw, y: dh} = this.size;

    const cols = width / frameWidth;
    const frameIndex = this.getAnimationFrame();
    if (frameIndex === undefined) {
      return;
    }
    const frameCol = Math.trunc(frameIndex % cols);
    const frameRow = Math.trunc(frameIndex / cols);
    const frameX = frameCol * frameWidth;
    const frameY = frameRow * frameHeight;
    ctx.image(this.image, -dw / 2, -dh / 2, dw, dh, frameX, frameY, frameWidth, frameHeight);
  }
}
