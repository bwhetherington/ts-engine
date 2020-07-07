import { LM } from 'core/log';
import { v1 as genUuid } from 'uuid';

function createFromTemplate(templateName: string): Node | null {
  const template = document.getElementById(templateName);
  if (template instanceof HTMLTemplateElement) {
    const { content } = template;
    const cloned = content.cloneNode(true);
    console.table(cloned);
    return cloned;
  } else {
    return null;
  }
}

export class Component extends HTMLElement {
  protected root?: ShadowRoot;

  constructor(templateName: string) {
    super();

    const template = createFromTemplate(templateName);
    if (template) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template);
      this.root = shadowRoot;
    } else {
      LM.error(`could not create element <${templateName}>`);
    }
  }

  protected queryChild(query: string): Element | undefined {
    return this.root?.querySelector(query) ?? undefined;
  }
}