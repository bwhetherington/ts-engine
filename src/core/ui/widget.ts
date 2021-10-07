import {Observer} from 'core/event';
import {Vector} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';

export type WidgetProps<T> = T & {children?: Widget<any>[]};

export abstract class Widget<T = {}> {
  protected props: Omit<WidgetProps<T>, 'children'>;
  protected children: Widget<any>[];
  protected observer: Observer = new Observer();
  protected shouldUpdateSize: boolean = true;

  private cachedSize_: Vector = new Vector();

  constructor({children = [], ...props}: WidgetProps<T>) {
    this.props = props;
    this.children = children ?? [];
  }

  public onMount(): void {}

  public onUnmount(): void {
    this.observer.cleanup();
  }

  protected abstract measure(
    _ctx: GraphicsContext,
    _parent?: Widget<any>
  ): Vector;

  public getSize(ctx: GraphicsContext, _parent?: Widget<any>): Vector {
    return this.measure(ctx);
    // if (this.shouldUpdateSize) {
    //   this.cachedSize_ = this.measure(ctx);
    //   this.shouldUpdateSize = false;
    // }
    // return this.cachedSize_;
  }

  public abstract render(ctx: GraphicsContext): void;
}
