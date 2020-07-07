import { LM } from 'core/log';
import { v1 as genUuid } from 'uuid';

export abstract class Component extends HTMLElement {
  protected root?: ShadowRoot;

  public static componentName: string;

  constructor(source: string) {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = source;
    console.log(shadowRoot);
    this.root = shadowRoot;
  }

  protected queryChild(query: string): HTMLElement | undefined {
    return this.root?.querySelector(query) ?? undefined;
  }
}

export function registerComponent(
  Custom: (new () => Component) & typeof Component
) {
  const name = Custom.componentName;
  console.log('register ' + name);
  window.customElements.define(Custom.componentName, Custom);
}
