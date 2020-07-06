import { Data, Serializable } from 'core/serialize';

export class Vector implements Serializable {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.setXY(x, y);
  }

  public get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public set(v: Vector): void {
    this.setXY(v.x, v.y);
  }

  public setXY(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public add(v: Vector, scale: number = 1): void {
    this.addXY(v.x, v.y, scale);
  }

  public addXY(dx: number, dy: number, scale: number = 1): void {
    this.x += dx * scale;
    this.y += dy * scale;
  }

  public serialize(): Data {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public deserialize(data: Data): void {
    const { x, y } = data;
    if (typeof x === 'number' && typeof y === 'number') {
      this.setXY(x, y);
    }
  }
}
