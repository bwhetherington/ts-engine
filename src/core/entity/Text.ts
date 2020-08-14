import { Entity } from "./Entity";
import { EventManager } from "core/event";
import { TextUpdateEvent, TextRemoveEvent } from "core/text";
import { Data } from "core/serialize";

export class Text extends Entity {
  public static typeName: string = 'Text';

  public text: string = '';
  public tag?: string;
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Text.typeName;
    this.isCollidable = false;
    this.isVisible = false;
  }

  public step(dt: number): void {
    super.step(dt);

    EventManager.emit<TextUpdateEvent>({
      type: 'TextUpdateEvent',
      data: {
        id: this.id,
        isStatic: this.isStatic,
        text: this.text,
        tag: this.tag,
        color: this.color,
        x: this.position.x,
        y: this.position.y,
      },
    });
  }

  public cleanup(): void {
    EventManager.emit<TextRemoveEvent>({
      type: 'TextRemoveEvent',
      data: {
        id: this.id,
      },
    });

    super.cleanup();
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      text: this.text,
      label: this.tag,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { text, tag } = data;
    if (typeof text === 'string') {
      this.text = text;
    }
    if (typeof tag === 'string') {
      this.tag = tag;
    }
  }
}