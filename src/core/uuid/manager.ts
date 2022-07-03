import {NetworkManager} from '@/core/net';
import {UUID} from '@/core/uuid';

export class UUIDManager {
  private index: number = 0;
  // private generated: Set<UUID> = new Set();

  private generateInternal(): UUID {
    const index = this.index;
    this.index += 1;
    const id = NetworkManager.isClient() ? index * -1 : index;
    return '*' + id.toString(36);
    // return '-' + gen.new();
    // return '-' + uuid();
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
