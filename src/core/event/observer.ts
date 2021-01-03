import {Handler, EventData} from 'core/event';
import { UUID } from 'core/uuid';

export abstract class Observer {
  public abstract addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): UUID;
}
