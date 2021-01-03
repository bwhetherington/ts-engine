import { DataBuffer, DataSerializable } from 'core/buf';
import {Data, Serializable} from 'core/serialize';

export interface VectorLike {
  x: number;
  y: number;
}

export class Vector implements DataSerializable, Serializable, VectorLike {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.setXY(x, y);
  }

  public get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public get magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public set magnitude(amount: number) {
    const {magnitudeSquared} = this;
    if (magnitudeSquared > 0) {
      this.scale(amount / Math.sqrt(magnitudeSquared));
    }
  }

  public get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public set angle(angle: number) {
    const {magnitudeSquared} = this;
    if (magnitudeSquared > 0) {
      const mag = Math.sqrt(magnitudeSquared);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      this.setXY(mag * cos, mag * sin);
    }
  }

  public distanceTo(v: VectorLike): number {
    const {x, y} = this;
    this.add(v, -1);
    const dist = this.magnitude;
    this.setXY(x, y);
    return dist;
  }

  public angleTo(v: Vector): number {
    const {x, y} = v;
    v.add(this, -1);
    const angle = v.angle;
    v.setXY(x, y);
    return angle;
  }

  public set(v: VectorLike): void {
    this.setXY(v.x, v.y);
  }

  public setXY(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public add(v: VectorLike, scale: number = 1): void {
    this.addXY(v.x, v.y, scale);
  }

  public addXY(dx: number, dy: number, scale: number = 1): void {
    this.setXY(this.x + dx * scale, this.y + dy * scale);
  }

  public zero(): void {
    this.setXY(0, 0);
  }

  public serialize(): Data {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public deserialize(data: Data): void {
    const {x, y} = data;
    let {x: newX, y: newY} = this;
    if (typeof x === 'number') {
      newX = x;
    }
    if (typeof y === 'number') {
      newY = y;
    }
    this.setXY(newX, newY);
  }

  public dataSize(): number {
    return 16;
  }

  public dataSerialize(buf: DataBuffer): DataBuffer {
    buf.writeDouble(this.x);
    buf.writeDouble(this.y);
    return buf;
  }

  public dataDeserialize(buf: DataBuffer): void {
    const x = buf.readDouble();
    const y = buf.readDouble();
    this.setXY(x, y);
  }

  public scale(amount: number): void {
    this.x *= amount;
    this.y *= amount;
  }

  public normalize(): void {
    this.magnitude = 1;
  }
}

export class DirectionVector extends Vector {
  private curAngle: number = 0;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.setXY(x, y);
  }

  public setXY(x: number, y: number): void {
    super.setXY(x, y);
    if (!(x === 0 && y === 0)) {
      this.curAngle = Math.atan2(y, x);
    }
  }

  public get direction(): number {
    return this.curAngle;
  }
}
