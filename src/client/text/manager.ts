import { UUID } from "core/uuid";
import { EM } from "core/event";
import { TextUpdateEvent, TextRemoveEvent } from "core/text";
import { CM, Color, toCss } from "core/graphics";
import { LM } from "core/log";
import { PlayerManager } from "core/player";

const log = LM.forFile(__filename);

export class TextManager {
  private textEntities: Record<UUID, HTMLElement> = {};

  public initialize(): void {
    EM.addListener<TextUpdateEvent>('TextUpdateEvent', (event) => {
      const { id, isStatic = true, text, x, y, color } = event.data;
      let element = this.textEntities[id];
      if (!element) {
        log.debug('create text element');

        // Create new element
        element = document.createElement('div');
        element.className = 'dialog text-label';
        if (!isStatic) {
          element.className += ' label-fade';
        }
        element.id = id;
        this.textEntities[id] = element;

        const container = document.getElementById('text-pane');
        container?.appendChild(element);
      }

      this.updateText(element, text, x, y, color);
    });

    EM.addListener<TextRemoveEvent>('TextRemoveEvent', (event) => {
      const { id } = event.data;
      const element = this.textEntities[id];
      element?.parentElement?.removeChild(element);
      delete this.textEntities[id];
    });
  }

  private updateText(element: HTMLElement, text?: string, worldX?: number, worldY?: number, color?: Color) {
    if (typeof text === 'string') {
      if (text.length > 12) {
        text = text.slice(0, 9) + '...';
      }
      element.innerText = text;
    }

    if (typeof worldX === 'number' && typeof worldY === 'number') {
      const { x, y } = CM.toScreenSpace(worldX, worldY);
      const screenX = '' + (x - element.clientWidth / 2) + 'px';
      const screenY = '' + (y - element.clientHeight / 2) + 'px';

      element.style.top = screenY;
      element.style.left = screenX;
    }

    // if (color) {
    //   element.style.color = toCss(color);
    // }
  }
}