import {Data, Serializable} from '@/core/serialize';
import {VectorLike} from '@/core/geometry';
import {DataBuffer, DataSerializable} from '@/core/buf';

export interface RectangleLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Rectangle
  implements DataSerializable, Serializable, RectangleLike
{
  constructor(
    public width: number = 0,
    public height: number = 0,
    public x: number = 0,
    public y: number = 0
  ) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
  }

  public static centered(
    width: number = 0,
    height: number = 0,
    centerX: number = 0,
    centerY: number = 0
  ): Rectangle {
    const rect = new Rectangle(width, height);
    rect.centerX = centerX;
    rect.centerY = centerY;
    return rect;
  }

  public get centerX(): number {
    return this.x + this.width / 2;
  }

  public set centerX(x: number) {
    this.x = x - this.width / 2;
  }

  public get centerY(): number {
    return this.y + this.height / 2;
  }

  public set centerY(y: number) {
    this.y = y - this.height / 2;
  }

  public get farX(): number {
    return this.x + this.width;
  }

  public get farY(): number {
    return this.y + this.height;
  }

  public get diagonal(): number {
    return Math.sqrt(this.width * this.width + this.height * this.height);
  }

  public setCenterXY(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
  }

  public setCenter(v: VectorLike) {
    this.setCenterXY(v.x, v.y);
  }

  public containsPointXY(x: number, y: number): boolean {
    return this.x < x && x < this.farX && this.y < y && y < this.farY;
  }

  private intersectsPartial(other: Rectangle): boolean {
    const {x, y, farX, farY} = other;
    return (
      this.containsPointXY(x, y) ||
      this.containsPointXY(farX, y) ||
      this.containsPointXY(x, farY) ||
      this.containsPointXY(farX, farY)
    );
  }

  public intersects(other: Rectangle): boolean {
    return this.intersectsPartial(other) || other.intersectsPartial(this);
  }

  public contains(other: Rectangle): boolean {
    const {x, y, farX, farY} = other;
    return (
      this.containsPointXY(x, y) &&
      this.containsPointXY(farX, y) &&
      this.containsPointXY(x, farY) &&
      this.containsPointXY(farX, farY)
    );
  }

  public serialize(): Data {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  public deserialize(data: Data) {
    const {x, y, width, height} = data;
    if (typeof x === 'number') {
      this.x = x;
    }
    if (typeof y === 'number') {
      this.y = y;
    }
    if (typeof width === 'number') {
      this.width = width;
    }
    if (typeof height === 'number') {
      this.height = height;
    }
  }

  public dataSize(): number {
    return 16;
  }

  public dataSerialize(buf: DataBuffer) {
    buf.writeFloat(this.x);
    buf.writeFloat(this.y);
    buf.writeFloat(this.width);
    buf.writeFloat(this.height);
  }

  public dataDeserialize(buf: DataBuffer) {
    const x = buf.readFloat();
    const y = buf.readFloat();
    const w = buf.readFloat();
    const h = buf.readFloat();
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}
