import {DataBuffer, DataSerializable} from 'core/buf';
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

  public set magnitude(amount: number) {
    const {magnitudeSquared} = this;
    if (magnitudeSquared > 0) {
      this.scale(amount / Math.sqrt(magnitudeSquared));
    }
  }

  public get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public get magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
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
    return Math.sqrt(this.distanceToXYSquared(v.x, v.y));
  }

  public distanceToXYSquared(x: number, y: number): number {
    const {x: oldX, y: oldY} = this;
    this.addXY(-x, -y);
    const dist = this.magnitudeSquared;
    this.setXY(oldX, oldY);
    return dist;
  }

  public angleTo(v: Vector): number {
    const {x, y} = v;
    v.add(this, -1);
    const angle = v.angle;
    v.setXY(x, y);
    return angle;
  }

  public set(v: VectorLike) {
    this.setXY(v.x, v.y);
  }

  public setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public add(v: VectorLike, scale: number = 1) {
    this.addXY(v.x, v.y, scale);
  }

  public addXY(dx: number, dy: number, scale: number = 1) {
    this.setXY(this.x + dx * scale, this.y + dy * scale);
  }

  public zero() {
    this.setXY(0, 0);
  }

  public serialize(): Data {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public deserialize(data: Data) {
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
    return 8;
  }

  public dataSerialize(buf: DataBuffer) {
    buf.writeFloat(this.x);
    buf.writeFloat(this.y);
  }

  public dataDeserialize(buf: DataBuffer) {
    const x = buf.readFloat();
    const y = buf.readFloat();
    this.setXY(x, y);
  }

  public scale(amount: number) {
    this.x *= amount;
    this.y *= amount;
  }

  public normalize() {
    this.magnitude = 1;
  }

  public clone(): Vector {
    return new Vector(this.x, this.y);
  }
}

export class DirectionVector extends Vector {
  private curAngle: number = 0;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.setXY(x, y);
  }

  public override setXY(x: number, y: number) {
    super.setXY(x, y);
    if (!(x === 0 && y === 0)) {
      this.curAngle = Math.atan2(y, x);
    }
  }

  public get direction(): number {
    return this.curAngle;
  }

  public override clone(): Vector {
    const clone = new DirectionVector(this.x, this.y);
    clone.curAngle = this.curAngle;
    return clone;
  }
}
