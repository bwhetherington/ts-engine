import { Handler, EventData } from "core/event";

export abstract class Observer {
  public abstract addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): string;
}