import {SerializeManager} from '@/core/serialize';
import {Encoder} from '@/core/serialize/encoder';

const encoder = new Encoder();

const BREAK_POINTS = new Set([',', ':', '{', '}', '[', ']']);

const SYMBOLS: Record<string, any> = {
  '@': null,
  '+': true,
  '-': false,
};

function writeAtom(atom: any): string {
  switch (typeof atom) {
    case 'number':
      // This code is quite hot
      // eslint-disable-next-line
      return '#' + encoder.encode(atom);
    case 'boolean':
      if (atom) {
        return '+';
      } else {
        return '-';
      }
    default:
      if (atom === null) {
        return '@';
      }

      const str = SerializeManager.compressKey(atom);
      return str;
  }
}

function writeArray(value: any[]): string {
  let out = '[';

  for (let i = 0; i < value.length; i++) {
    if (i > 0) {
      out += ',';
    }
    const val = writeValue(value[i]);
    out += val;
  }

  return out + ']';
}

function writeObject(value: Record<string, any>): string {
  let out = '{';

  let isFirst = true;
  for (const key in value) {
    if (!value.hasOwnProperty(key)) {
      continue;
    }
    if (!isFirst) {
      out += ',';
    }
    isFirst = false;
    const compressedKey = SerializeManager.compressKey(key);
    const compressedValue = writeValue(value[key]);
    out += compressedKey + ':' + compressedValue;
  }

  return out + '}';
}

export function writeValue(value: any): string {
  if (value instanceof Array) {
    return writeArray(value);
  } else if (typeof value === 'object') {
    return writeObject(value);
  } else {
    return writeAtom(value);
  }
}

export class Parser {
  private input: string;
  private index: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  private isDone(): boolean {
    return this.index >= this.input.length;
  }

  private nextChar(): string {
    const ch = this.input[this.index];
    this.index += 1;
    return ch;
  }

  private scanToBreak(): string {
    const start = this.index;
    for (; this.index < this.input.length; this.index += 1) {
      if (BREAK_POINTS.has(this.input[this.index])) {
        return this.input.slice(start, this.index);
      }
    }
    return '';
  }

  public readValue(): any {
    const start = this.input[this.index];

    // Object
    if (start === '{') {
      this.index += 1;
      return this.readObject();
    }

    // Array
    if (start === '[') {
      this.index += 1;
      return this.readArray();
    }

    // Atom
    return this.readAtom();
  }

  private readArray(): any {
    const out: any = [];
    let isFirst = true;
    while (this.index < this.input.length) {
      if (this.input[this.index] === ']') {
        this.index += 1;
        break;
      }
      if (!isFirst) {
        this.readChar(',');
      }
      isFirst = false;
      const value = this.readValue();
      out.push(value);
    }
    return out;
  }

  private readChar(char: string) {
    const ch = this.nextChar();
    if (ch !== char) {
      throw new SyntaxError(
        `Expected '${char}', found '${ch}' at ${this.index - 1} in '${
          this.input
        }'`
      );
    }
  }

  private readObject(): any {
    const out: any = {};

    let isFirst = true;
    while (this.index < this.input.length) {
      if (this.input[this.index] === '}') {
        this.index += 1;
        break;
      }
      if (!isFirst) {
        this.readChar(',');
      }
      isFirst = false;
      this.readEntry(out);
    }

    return out;
  }

  private readEntry(dst: any) {
    const keyChunk = this.scanToBreak();
    this.readChar(':');
    const value = this.readValue();
    const key = SerializeManager.decompressKey(keyChunk);
    dst[key] = value;
  }

  private readString(): string {
    this.nextChar();
    const start = this.index;
    while (this.index < this.input.length) {
      const char = this.input[this.index];
      this.index += 1;
      if (char === '\\') {
        continue;
      }
      if (char === '"') {
        break;
      }
    }
    return this.input.slice(start, this.index - 1);
  }

  private readAtom(): any {
    const start = this.input[this.index];
    if (start === '"') {
      return this.readString();
    }

    const chunk = this.scanToBreak();

    // Symbol
    const symbol = SYMBOLS[chunk];
    if (symbol !== undefined) {
      return symbol;
    }

    // Number
    if (chunk.startsWith('#')) {
      return encoder.decode(chunk.substring(1));
    }

    return SerializeManager.decompressKey(chunk);
  }
}
