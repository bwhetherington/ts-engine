import {Unit} from 'core/entity';
import {Observer} from 'core/event';
import {UUID, UUIDManager} from 'core/uuid';

export class Effect extends Observer {
  public id: UUID;
  public target?: Unit;
  public source?: Unit;

  constructor() {
    super();
    this.id = UUIDManager.generate();
  }

  public override cleanup() {
    super.cleanup();
    UUIDManager.free(this.id);
  }
}
