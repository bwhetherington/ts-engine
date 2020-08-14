import { UUID } from "core/uuid";
import { EventManager } from "core/event";
import { TextUpdateEvent, TextRemoveEvent } from "core/text";
import { CameraManager, Color, toCss } from "core/graphics";
import { LogManager } from "core/log";
import { PlayerManager } from "core/player";

const log = LogManager.forFile(__filename);

const MAX_LENGTH = 20;

interface TextEntry {
  parent: HTMLElement;
  text: HTMLElement;
  tag: HTMLElement;
}

export class TextManager {
  private textEntities: Record<UUID, TextEntry> = {};

  public initialize(): void {
    EventManager.addListener<TextUpdateEvent>('TextUpdateEvent', (event) => {
      const { id, isStatic = true, text, tag, x, y, color } = event.data;
      let entry = this.textEntities[id];
      if (!entry) {
        log.debug('create text element');

        // Create new element
        const parent = document.createElement('div');
        parent.className = 'dialog text-label';
        if (!isStatic) {
          parent.className += ' label-fade';
        }

        const textElement = document.createElement('span');
        textElement.className = 'label-text';
        parent.appendChild(textElement);

        const tagElement = document.createElement('span');
        tagElement.className = 'label-tag';
        parent.appendChild(tagElement);

        parent.id = id;
        entry = {
          parent,
          text: textElement,
          tag: tagElement,
        };
        this.textEntities[id] = entry;

        const container = document.getElementById('text-pane');
        container?.appendChild(parent);
      }

      this.updateText(entry, text, tag, x, y, color);
    });

    EventManager.addListener<TextRemoveEvent>('TextRemoveEvent', (event) => {
      const { id } = event.data;
      const entry = this.textEntities[id];
      entry.parent?.parentElement?.removeChild(entry.parent);
      delete this.textEntities[id];
    });
  }

  private updateText(entry: TextEntry, text?: string, tag?: string, worldX?: number, worldY?: number, color?: Color) {
    if (text) {
      if (text.length > MAX_LENGTH) {
        text = text.slice(0, MAX_LENGTH - 3) + '...';
      }
      entry.text.innerText = text;
    }

    if (tag && tag.length > 0) {
      entry.tag.innerText = ' ' + tag;
    }

    if (!(worldX === undefined || worldY === undefined)) {
      const { x, y } = CameraManager.toScreenSpace(worldX, worldY);
      const screenX = '' + (x - entry.parent.clientWidth / 2) + 'px';
      const screenY = '' + (y - entry.parent.clientHeight / 2) + 'px';

      entry.parent.style.top = screenY;
      entry.parent.style.left = screenX;
    }

    // if (color) {
    //   element.style.color = toCss(color);
    // }
  }
}