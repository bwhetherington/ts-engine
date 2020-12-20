import {Entity, Unit} from 'core/entity';
import {EventManager} from 'core/event';
import {GraphicsContext, rgb} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {Data} from 'core/serialize';

export enum FeedVariant {
  Small = 0,
  Medium = 1,
  Large = 2,
}

const SIDE_COUNTS = {
  [FeedVariant.Small]: 3,
  [FeedVariant.Medium]: 4,
  [FeedVariant.Large]: 5,
};

export class Feed extends Unit {
  public static typeName: string = 'Feed';

  private variant: FeedVariant = FeedVariant.Small;

  public constructor() {
    super();
    this.type = Feed.typeName;
    this.setVariant(FeedVariant.Small);
    this.friction = 100;
  }

  public setVariant(variant: FeedVariant): void {
    this.variant = variant;
    switch (variant) {
      case FeedVariant.Small:
        this.boundingBox.width = 40;
        this.boundingBox.height = 40;
        this.setColor(rgb(0.85, 0.55, 0.35));
        this.setXPWorth(5);
        this.setMaxLife(20, true);
        this.mass = 5;
        break;
      case FeedVariant.Medium:
        this.boundingBox.width = 40;
        this.boundingBox.height = 40;
        this.setColor(rgb(0.85, 0.85, 0.35));
        this.setXPWorth(10);
        this.setMaxLife(40, true);
        this.mass = 5;
        break;
      case FeedVariant.Large:
        this.boundingBox.width = 50;
        this.boundingBox.height = 50;
        this.setColor(rgb(0.35, 0.55, 0.85));
        this.setXPWorth(40);
        this.setMaxLife(160, true);
        this.mass = 10;
        break;
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      variant: this.variant,
    };
  }

  public deserialize(obj: Data): void {
    super.deserialize(obj);

    const {variant} = obj;
    if (typeof variant === 'number' && FeedVariant.hasOwnProperty(variant)) {
      this.setVariant(variant);
    }
  }

  public render(ctx: GraphicsContext): void {
    const {width} = this.boundingBox;
    GraphicsPipeline.pipe()
      .rotate(EventManager.timeElapsed / 10)
      .run(ctx, (ctx) => {
        ctx.regularPolygon(
          0,
          0,
          SIDE_COUNTS[this.variant],
          width / 2,
          this.getColor()
        );
      });
  }
}
