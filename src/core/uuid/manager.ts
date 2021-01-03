import {UUID} from 'core/uuid';
import {NetworkManager} from 'core/net';
import {LogManager} from 'core/log';
import {BasicRNG, RNG, RNGManager} from 'core/random';

const log = LogManager.forFile(__filename);

export class UUIDManager {
  private generated: Set<UUID> = new Set();

  private generateInternal(): UUID {
    const num = RNGManager.next();
    // const a2 = ('000' + a.toString(36)).slice(-3);
    // const b2 = ('000' + b.toString(36)).slice(-3);
    const flag = NetworkManager.isClient() ? 1 : 0;
    return num + flag;
    // return flag + a2 + b2;
  }

  public generate(): UUID {
    let uuid = this.generateInternal();
    while (this.generated.has(uuid)) {
      log.warn('UUID collision');
      uuid = this.generateInternal();
    }
    this.generated.add(uuid);
    return uuid;
  }

  public free(uuid: UUID) {
    this.generated.delete(uuid);
  }
}
