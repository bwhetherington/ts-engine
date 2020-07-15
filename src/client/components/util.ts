import { LM as InternalLogger } from 'core/log';
import { v1 as genUuid } from 'uuid';

const LM = InternalLogger.forFile(__filename);

export abstract class Component extends HTMLElement {
  protected root?: ShadowRoot;

  public static componentName: string;

  constructor(source: string) {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = source;
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
  LM.debug(`<${name}> registered`);
  window.customElements.define(Custom.componentName, Custom);
}
