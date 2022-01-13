import {Data} from '@/core/serialize';
import {Encoder} from './encoder';

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

// function compose<T, U, V>(f: (x: T) => U, g: (x: U) => V): (x: T) => V {
//   return (x) => g(f(x));
// }

export class SerializeManager {
  private serializer: (input: Data) => string = JSON.stringify;

  private deserializer: (input: string) => Data = JSON.parse;

  public serialize(data: Data): string {
    return this.serializer(data);
  }

  public deserialize(data: string): Data {
    return this.deserializer(data);
  }
}
