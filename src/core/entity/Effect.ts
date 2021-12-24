import {Unit} from 'core/entity';
import {Observer} from 'core/event';

export class Effect extends Observer {
  protected parent?: Unit;

  constructor(parent?: Unit) {
    super();
    this.parent = parent;
  }
}
