import {Entity} from 'core/entity';
import {Data} from 'core/serialize';
import {ToString} from '.';

export class StringBuffer implements ToString {
  private buffer: string[] = [];

  public append(s: string | ToString): void {
    if (typeof s === 'string') {
      for (let i = 0; i < s.length; i++) {
        this.buffer.push(s[i]);
      }
    } else {
      this.append(s.toString());
    }
  }

  public toString(): string {
    let out = '';
    for (let i = 0; i < this.buffer.length; i++) {
      out += this.buffer[i];
    }
    return out;
  }

  private formatArray<T>(array: T[]): void {
    this.append('[');
    for (let i = 0; i < array.length - 1; i++) {
      this.formatInternal(array[i]);
      this.append(',');
    }
    if (array.length > 0) {
      this.formatInternal(array[array.length - 1]);
    }
    this.append(']');
  }

  private formatInternal(item: any): void {
    if (item === null) {
      this.append('null');
    } else if (item === undefined) {
      this.append('undefined');
    } else if (typeof item === 'string') {
      this.append("'" + item + "'");
    } else if (item instanceof Array) {
      this.formatArray(item);
    } else if (typeof item === 'object') {
      // Check if it is serializable
      if (item instanceof Entity) {
        this.append(item.toString());
      } else if (typeof item.serialize === 'function') {
        this.formatData(item.serialize());
      } else {
        this.formatData(item);
      }
    } else {
      this.append('' + item);
    }
  }

  public formatData(data: Data): StringBuffer {
    this.append('{');

    const keys = Object.keys(data);

    for (let i = 0; i < keys.length - 1; i++) {
      this.append(keys[i] + ':');
      this.formatInternal(data[keys[i]]);
      this.append(',');
    }
    if (keys.length > 0) {
      this.append(keys[keys.length - 1] + ':');
      this.formatInternal(data[keys[keys.length - 1]]);
    }

    this.append('}');
    return this;
  }
}
