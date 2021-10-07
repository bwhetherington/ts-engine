import { Vector } from "core/geometry";
import { GraphicsContext } from "core/graphics";
import { Widget, WidgetProps } from "core/ui";

export abstract class TemplateWidget<T = {}> extends Widget<T> {
  private isMounted: boolean = false;
  private shouldUpdate: boolean = true;
  private template?: Widget<any>;

  protected abstract renderTemplate(): Widget<any>;

  public forceUpdate(): void {
    this.shouldUpdate = true;
    this.shouldUpdateSize = true;
  }

  private tryUpdateTemplate(): Widget<any> {
    let template = this.template;
    if (this.shouldUpdate || !template) {
      template = this.renderTemplate();
      this.template?.onUnmount();
      template.onMount();
      this.template = template;
      this.shouldUpdate = false;
    }
    if (!this.isMounted) {
      this.isMounted = true;
      this.onMount();
    }
    return template;
  }

  public render(ctx: GraphicsContext): void {
    this.tryUpdateTemplate();
    this.template?.render(ctx);
  }

  protected measure(ctx: GraphicsContext): Vector {
    this.tryUpdateTemplate();
    return this.template?.getSize(ctx) ?? new Vector(0, 0);
  }
}

export abstract class StatefulWidget<T, S> extends TemplateWidget<T> {
  protected abstract state: S;

  protected setState(state: S): void {
    this.state = state;
    this.forceUpdate();
  }

  protected updateState(state: Partial<S>): void {
    this.setState({
      ...this.state,
      ...state,
    });
  }
}

export function functionalWidget<T>(
  f: (props: WidgetProps<T>) => Widget<any>,
): new (props: WidgetProps<T>) => TemplateWidget<T> {
  return class extends TemplateWidget<T> {
    protected renderTemplate(): Widget<any> {
      // Unfortunate, Typescript doesn't appear to be able to understand that
      // Omit<WidgetProps<T>, 'children'> & {children: Widget<any>[]} == WidgetProps<T>
      // So we are forced to use a dirty type cast
      return f({
        ...this.props,
        children: this.children,
      } as WidgetProps<T>);
    }
  };
}
