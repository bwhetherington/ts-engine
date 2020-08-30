import { Vector } from '.';

export class Matrix {
  private a0: number = 0;
  private a1: number = 0;
  private a2: number = 0;
  private b0: number = 0;
  private b1: number = 0;
  private b2: number = 0;
  private c0: number = 0;
  private c1: number = 0;
  private c2: number = 0;

  public identity(): Matrix {
    this.a0 = 1;
    this.a1 = 0;
    this.a2 = 0;
    this.b0 = 0;
    this.b1 = 1;
    this.b2 = 0;
    this.c0 = 0;
    this.c1 = 0;
    this.c2 = 1;
    return this;
  }

  public multiplyPointXY(x: number, y: number, dst?: Vector): Vector {
    if (dst === undefined) {
      dst = new Vector();
    }

    dst.x = this.a0 * x + this.a1 * y + this.a2;
    dst.y = this.b0 * x + this.b1 * y + this.b2;

    return dst;
  }

  public multiplyPoint(src: Vector, dst?: Vector): Vector {
    return this.multiplyPointXY(src.x, src.y, dst);
  }

  public multiply(src: Matrix, dst?: Matrix): Matrix {
    if (dst === undefined) {
      dst = new Matrix();
    }

    dst.a0 = this.a0 * src.a0 + this.a1 * src.b0 + this.a2 * src.c0;
    dst.a1 = this.a0 * src.a1 + this.a1 * src.b1 + this.a2 * src.c1;
    dst.a2 = this.a0 * src.a2 + this.a1 * src.b2 + this.a2 * src.c2;
    dst.b0 = this.b0 * src.a0 + this.b1 * src.b0 + this.b2 * src.c0;
    dst.b1 = this.b0 * src.a1 + this.b1 * src.b1 + this.b2 * src.c1;
    dst.b2 = this.b0 * src.a2 + this.b1 * src.b2 + this.b2 * src.c2;
    dst.c0 = this.c0 * src.a0 + this.c1 * src.b0 + this.c2 * src.c0;
    dst.c1 = this.c0 * src.a1 + this.c1 * src.b1 + this.c2 * src.c1;
    dst.c2 = this.c0 * src.a2 + this.c1 * src.b2 + this.c2 * src.c2;

    return dst;
  }

  public translate(x: number, y: number): Matrix {
    this.identity();
    this.a2 = x;
    this.b2 = y;
    return this;
  }

  public rotate(theta: number): Matrix {
    this.identity();
    this.a0 = Math.cos(theta);
    this.a1 = -Math.sin(theta);
    this.b0 = Math.sin(theta);
    this.b1 = Math.cos(theta);
    return this;
  }

  public scale(sx: number, sy: number): Matrix {
    this.identity();
    this.a0 = sx;
    this.b1 = sy;
    return this;
  }

  public set(src: Matrix): Matrix {
    this.a0 = src.a0;
    this.a1 = src.a1;
    this.a2 = src.a2;
    this.b0 = src.b0;
    this.b1 = src.b1;
    this.b2 = src.b2;
    this.c0 = src.c0;
    this.c1 = src.c1;
    this.c2 = src.c2;
    return this;
  }

  public toString(): string {
    return `${this.a0},${this.a1},${this.a2}\n${this.b0},${this.b1},${this.b2}\n${this.c0},${this.c1},${this.c2}`;
  }
}
