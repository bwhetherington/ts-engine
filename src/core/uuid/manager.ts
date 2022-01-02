import {UUID} from 'core/uuid';
import {NetworkManager} from 'core/net';
import {LogManager} from 'core/log';
import {RNGManager} from 'core/random';

import {v4 as uuid} from 'uuid';

const log = LogManager.forFile(__filename);

const UUID_SIZE = 1_000_000_000;

export class UUIDManager {
  // private generated: Set<UUID> = new Set();

  private generateInternal(): UUID {
    return uuid();
    // const num = RNGManager.nextInt(0, UUID_SIZE);
    // const flag = NetworkManager.isClient() ? UUID_SIZE : 0;
    // return num + flag;
  }

  public getCount(): number {
    return 0;
    // return this.generated.size;
  }

  public generate(): UUID {
    let uuid = this.generateInternal();
    // while (this.generated.has(uuid)) {
    //   log.warn('UUID collision');
    //   uuid = this.generateInternal();
    // }
    // this.generated.add(uuid);
    return uuid;
  }

  public free(uuid: UUID) {
    // this.generated.delete(uuid);
  }

  public from(str: string): UUID {
    return str;
    // return parseInt(str);
  }
}
