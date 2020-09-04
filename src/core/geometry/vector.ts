import { Data, Serializable } from 'core/serialize';

export interface VectorLike {
  x: number;
  y: number;
}

export class Vector implements Serializable, VectorLike {
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
    const { magnitudeSquared } = this;
    if (magnitudeSquared > 0) {
      this.scale(amount / Math.sqrt(magnitudeSquared));
    }
  }

  public get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public set angle(angle: number) {
    const { magnitudeSquared } = this;
    if (magnitudeSquared > 0) {
      const mag = Math.sqrt(magnitudeSquared);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      this.x = mag * cos;
      this.y = mag * sin;
    }
  }

  public distanceTo(v: VectorLike): number {
    const { x, y } = this;
    this.add(v, -1);
    const dist = this.magnitude;
    this.setXY(x, y);
    return dist;
  }

  public angleTo(v: Vector): number {
    const { x, y } = v;
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
    this.x += dx * scale;
    this.y += dy * scale;
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
    const { x, y } = data;
    if (typeof x === 'number') {
      this.x = x;
    }
    if (typeof y === 'number') {
      this.y = y;
    }
  }

  public scale(amount: number): void {
    this.x *= amount;
    this.y *= amount;
  }

  public normalize(): void {
    this.magnitude = 1;
  }
}
