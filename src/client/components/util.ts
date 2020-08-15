import { LogManager } from 'core/log';
import { v1 as genUuid } from 'uuid';

const log = LogManager.forFile(__filename);

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
  log.trace(`<${name}> registered`);
  window.customElements.define(Custom.componentName, Custom);
}

export function removeChildren(element: HTMLElement): void {
  while (element.hasChildNodes() && element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
