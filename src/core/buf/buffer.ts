import {DataSerializable} from '@/core/buf';
import {Rectangle, RectangleLike, Vector, VectorLike} from '@/core/geometry';
import {Color} from '@/core/graphics';
import {Iterator} from '@/core/iterator';

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

  public reset() {
    this.offset = 0;
  }

  public readFloat(): number {
    const num = this.buffer.readFloatBE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeFloat(num: number) {
    this.buffer.writeFloatBE(num, this.offset);
    this.offset += 4;
  }

  public readDouble(): number {
    const num = this.buffer.readDoubleBE(this.offset);
    this.offset += 8;
    return num;
  }

  public writeDouble(num: number) {
    this.buffer.writeDoubleBE(num, this.offset);
    this.offset += 8;
  }

  public readUInt32(): number {
    const num = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeUInt32(num: number) {
    this.buffer.writeUInt32BE(num, this.offset);
    this.offset += 4;
  }

  public readInt32(): number {
    const num = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return num;
  }

  public writeInt32(num: number) {
    this.buffer.writeInt32BE(num, this.offset);
    this.offset += 4;
  }

  public readBoolean(): boolean {
    const byte = this.buffer.readUInt8();
    this.offset += 1;
    return byte !== 0;
  }

  public writeBoolean(value: boolean) {
    this.buffer.writeUInt8(value ? 1 : 0, this.offset);
    this.offset += 1;
  }

  public readVector(): Vector {
    const x = this.readDouble();
    const y = this.readDouble();
    return new Vector(x, y);
  }

  public writeVector({x, y}: VectorLike) {
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

  public writeRectangle({x, y, width, height}: RectangleLike) {
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

  public writeString(s: string, length?: number) {
    if (length === undefined) {
      this.writeUInt32(0);
      const len = this.buffer.write(s, this.offset, 'utf-8');
      this.offset -= 4;
      this.writeUInt32(len);
      this.offset += len;
    } else {
      this.writeUInt32(length);
      const buf = Buffer.alloc(length);
      buf.write(s, 'utf-8');
      this.buffer.write(buf.toString('utf-8'), this.offset, 'utf-8');
      this.offset += length;
    }
  }

  public toRaw(): Buffer {
    return this.buffer;
  }

  public readUInt8(): number {
    const value = this.buffer.readUInt8();
    this.offset += 1;
    return value;
  }

  public writeUInt8(value: number) {
    this.buffer.writeUInt8(value);
    this.offset += 1;
  }

  public readColor(): Color {
    const red = this.readUInt8() / 255;
    const green = this.readUInt8() / 255;
    const blue = this.readUInt8() / 255;
    const alpha = this.readUInt8() / 255;
    return {red, green, blue, alpha};
  }

  public writeColor(color: Color) {
    const {red, green, blue, alpha = 1} = color;
    const ri = Math.floor(red * 255);
    const gi = Math.floor(green * 255);
    const bi = Math.floor(blue * 255);
    const ai = Math.floor(alpha * 255);
    this.writeUInt8(ri);
    this.writeUInt8(gi);
    this.writeUInt8(bi);
    this.writeUInt8(ai);
  }

  public writeList(list: DataSerializable[]) {
    // Compute length
    this.writeUInt32(list.length);
    Iterator.from(list).forEach((x) => x.dataSerialize(this));
  }
}
