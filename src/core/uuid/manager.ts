import {UUID} from '@/core/uuid';

import {v4 as uuid} from 'uuid';

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
    return this.generateInternal();
  }

  public free(_uuid: UUID) {
    // Do nothing
  }

  public from(str: string): UUID {
    return str;
    // return parseInt(str);
  }
}
