import {Data, UpdateKeysEvent} from '@/core/serialize';
import {EventManager} from '../event';
import {Iterator} from '../iterator';
import {isUUID} from '../uuid';
import {Parser, writeValue} from './data';
import {Encoder} from './encoder';
import {KEYS} from './key';

const encoder = new Encoder();

export function compress(obj: Data): Data {
  const newObj: Data = obj instanceof Array ? [] : {};

  for (const [key, val] of Object.entries(obj)) {
    switch (typeof val) {
      case 'number':
        newObj[key] = '!' + encoder.encode(val);
        break;
      case 'object':
        newObj[key] = compress(val);
        break;
      default:
        newObj[key] = val;
    }
  }

  return newObj;
}

export function decompress(obj: Data): Data {
  const newObj: Data = obj instanceof Array ? [] : {};

  for (const [key, val] of Object.entries(obj)) {
    switch (typeof val) {
      case 'string':
        if (val.startsWith('!')) {
          newObj[key] = encoder.decode(val.slice(1));
        } else {
          newObj[key] = val;
        }
        break;
      case 'object':
        newObj[key] = decompress(val);
        break;
      default:
        newObj[key] = val;
    }
  }

  return newObj;
}

export class SerializeManager {
  private index: number = 0;
  private keys: Record<string, number> = {};

  private keyToIndex: Map<string, number> = new Map();
  private indexToKey: Map<number, string> = new Map();

  public initialize() {
    // Populate indices
    Iterator.entries(KEYS).forEach(([key, index]) => {
      this.keyToIndex.set(key, index);
      this.indexToKey.set(index, key);
    });
  }

  public compressKey(key: string): string {
    if (key?.startsWith('*')) {
      return key;
    }

    const saved = this.keyToIndex.get(key);

    if (saved === undefined) {
      return '"' + key + '"';
    }

    return saved.toString(36);
  }

  private compress(input: any): any {
    if (typeof input === 'object') {
      const out: any = input instanceof Array ? [] : {};

      Iterator.entries(input).forEach(([key, value]) => {
        const compressedKey = this.compressKey(key);
        const compressedValue = this.compress(value);
        out[compressedKey] = compressedValue;
      });

      return out;
    } else {
      return compress(input);
    }
  }

  public decompressKey(key: string): string {
    if (key.startsWith('*')) {
      return key;
    }
    if (key.startsWith('"')) {
      return key.slice(1, key.length - 1);
    }
    const index = parseInt(key, 36);
    return this.indexToKey.get(index) ?? key.slice(1, key.length - 1);
  }

  private decompress(input: any): any {
    if (typeof input === 'object') {
      const out: any = input instanceof Array ? [] : {};
      Iterator.entries(input).forEach(([key, value]) => {
        const decompressedKey = this.decompressKey(key);
        const decompressedValue = this.decompress(value);
        out[decompressedKey] = decompressedValue;
      });
      return out;
    } else {
      return decompress(input);
    }
  }

  private onChange() {
    EventManager.emitEvent(UpdateKeysEvent, {
      keys: {...this.keys},
    });
  }

  private watch(obj: Data) {
    Iterator.flatEntries(obj).forEach(([key, value]) => {
      if (!(this.keys.hasOwnProperty(key) || isUUID(key))) {
        this.keys[key] = this.index;
        this.index += 1;
        this.onChange();
      } else if (
        typeof value === 'string' &&
        key === 'type' &&
        !this.keys.hasOwnProperty(value)
      ) {
        this.keys[value] = this.index;
        this.index += 1;
        this.onChange();
      }
    });
  }

  private serializer: (input: Data) => string = (input) => {
    this.watch(input);
    return writeValue(input);
  };

  private deserializer: (input: string) => Data = (input) => {
    const parser = new Parser(input);
    const output = parser.readValue();
    // this.watch(output);
    return output;
  };

  public serialize(data: Data): string {
    return this.serializer(data);
  }

  public deserialize(data: string): Data {
    return this.deserializer(data);
  }
}
