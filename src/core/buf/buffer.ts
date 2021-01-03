import { Rectangle, Vector } from "core/geometry";
import { clamp } from "core/util";

export class DataBuffer {
  private buffer: Buffer;
  private offset: number;

  private constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  public static reader(buf: Buffer): DataBuffer {
    return new DataBuffer(buf);
  }

  public static writer(capacity: number): DataBuffer {
    return new DataBuffer(Buffer.alloc(capacity));
  }

  public reset(): void {
    this.offset = 0;
  }

  public readFloat(): number {
    const num = this.buffer.readFloatBE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeFloat(number: number): void {
    this.buffer.writeFloatBE(number, this.offset);
    this.offset += 4;
  }

  public readDouble(): number {
    const num = this.buffer.readDoubleBE(this.offset);
    this.offset += 8;
    return num;
  }

  public writeDouble(number: number): void {
    this.buffer.writeDoubleBE(number, this.offset);
    this.offset += 8;
  }

  public readUInt32(): number {
    const num = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeUInt32(number: number): void {
    this.buffer.writeUInt32BE(number, this.offset);
    this.offset += 4;
  }

  public readInt32(): number {
    const num = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeInt32(number: number): void {
    this.buffer.writeInt32BE(number, this.offset);
    this.offset += 4;
  }

  public readBoolean(): boolean {
    const byte = this.buffer.readUInt8();
    this.offset += 1;
    return byte !== 0;
  }

  public writeBoolean(value: boolean): void {
    this.buffer.writeUInt8(value ? 1 : 0, this.offset);
    this.offset += 1;
  }

  public readVector(): Vector {
    const x = this.readDouble();
    const y = this.readDouble();
    return new Vector(x, y);
  }

  public writeVector({x, y}: Vector): void {
    this.writeDouble(x);
    this.writeDouble(y);
  }

  public readRectangle(): Rectangle {
    const x = this.readDouble();
    const y = this.readDouble();
    const w = this.readDouble();
    const h = this.readDouble();
    return new Rectangle(x, y, w, h);
  }

  public writeRectangle({x, y, width, height}: Rectangle): void {
    this.writeDouble(x);
    this.writeDouble(y);
    this.writeDouble(width);
    this.writeDouble(height);
  }

  public readString(): string {
    const len = this.readUInt32();
    const sub = this.buffer.subarray(this.offset, this.offset + len);
    this.offset += len;
    return sub.toString('utf-8');
  }

  public writeString(s: string, length?: number): void {
    if (length === undefined) {
      this.writeUInt32(0);
      const len = this.buffer.write(s, this.offset, 'utf-8');
      this.offset -= 4;
      this.writeUInt32(len);
      this.offset += len;
    } else {
      const buf = Buffer.alloc(length);
      buf.write(s, 'utf-8');
      this.writeUInt32(length);
      console.log('len', length, this.buffer.write(buf.toString('utf-8'), this.offset, 'utf-8'));
      this.offset += length;

      // const strBuf = Buffer.from(s);
      // const strBufSub = strBuf.subarray(0, clamp(length, 0, strBuf.length));
      // this.buffer.write(strBufSub);
    }
  }

  public toRaw(): Buffer {
    return this.buffer;
  }
}