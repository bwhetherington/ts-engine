import { Entity } from "./Entity";
import { EM } from "core/event";
import { TextUpdateEvent, TextRemoveEvent } from "core/text";
import { Data } from "core/serialize";

export class Text extends Entity {
  public static typeName: string = 'Text';

  public text: string = '';
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Text.typeName;
    this.isCollidable = false;
    this.isVisible = false;
  }

  public step(dt: number): void {
    super.step(dt);

    EM.emit<TextUpdateEvent>({
      type: 'TextUpdateEvent',
      data: {
        id: this.id,
        isStatic: this.isStatic,
        text: this.text,
        color: this.color,
        x: this.position.x,
        y: this.position.y,
      },
    });
  }

  public cleanup(): void {
    EM.emit<TextRemoveEvent>({
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
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { text } = data;
    if (typeof text === 'string') {
      this.text = text;
    }
  }
}