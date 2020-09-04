import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export type Props = Record<string, string>;

export class ElementFactory {
  public create(type: string, props: Props = {}): HTMLElement {
    log.trace('create element <' + type + ' />');
    const element = document.createElement(type);
    for (const key in props) {
      element.setAttribute(key, props[key]);
    }
    return element;
  }

  public div(props: Props = {}): HTMLDivElement {
    return this.create('div', props) as HTMLDivElement;
  }

  public span(props: Props = {}): HTMLSpanElement {
    return this.create('span', props) as HTMLSpanElement;
  }

  public tr(props: Props = {}): HTMLTableRowElement {
    return this.create('tr', props) as HTMLTableRowElement;
  }

  public td(props: Props = {}): HTMLTableDataCellElement {
    return this.create('td', props) as HTMLTableDataCellElement;
  }

  public form(props: Props = {}): HTMLFormElement {
    return this.create('form', props) as HTMLFormElement;
  }

  public input(props: Props = {}): HTMLInputElement {
    return this.create('input', props) as HTMLInputElement;
  }

  public canvas(props: Props = {}): HTMLCanvasElement {
    return this.create('canvas', props) as HTMLCanvasElement;
  }
}

export const EF = new ElementFactory();
