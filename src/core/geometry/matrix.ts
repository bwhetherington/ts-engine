import {Vector} from 'core/geometry';
import {Data, Serializable} from 'core/serialize';

export class Matrix3 implements Serializable {
  private a0: number = 0;
  private a1: number = 0;
  private a2: number = 0;
  private b0: number = 0;
  private b1: number = 0;
  private b2: number = 0;
  private c0: number = 0;
  private c1: number = 0;
  private c2: number = 0;

  public identity(): Matrix3 {
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

  public multiply(src: Matrix3, dst?: Matrix3): Matrix3 {
    if (dst === undefined) {
      dst = new Matrix3();
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

  public translate(x: number, y: number): Matrix3 {
    this.identity();
    this.a2 = x;
    this.b2 = y;
    return this;
  }

  public rotate(theta: number): Matrix3 {
    this.identity();
    this.a0 = Math.cos(theta);
    this.a1 = -Math.sin(theta);
    this.b0 = Math.sin(theta);
    this.b1 = Math.cos(theta);
    return this;
  }

  public scale(sx: number, sy: number): Matrix3 {
    this.identity();
    this.a0 = sx;
    this.b1 = sy;
    return this;
  }

  public set(src: Matrix3): Matrix3 {
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

  public serialize(): Data {
    return [
      this.a0,
      this.a1,
      this.a2,
      this.b0,
      this.b1,
      this.b2,
      this.c0,
      this.c1,
      this.c2,
    ];
  }

  public deserialize(data: Data) {
    if (data instanceof Array) {
      const [a0, a1, a2, b0, b1, b2, c0, c1, c2] = data;
      if (typeof a0 === 'number') {
        this.a0 = a0;
      }
      if (typeof a1 === 'number') {
        this.a1 = a1;
      }
      if (typeof a2 === 'number') {
        this.a2 = a2;
      }
      if (typeof b0 === 'number') {
        this.b0 = b0;
      }
      if (typeof b1 === 'number') {
        this.b1 = b1;
      }
      if (typeof b2 === 'number') {
        this.b2 = b2;
      }
      if (typeof c0 === 'number') {
        this.c0 = c0;
      }
      if (typeof c1 === 'number') {
        this.c1 = c1;
      }
      if (typeof c2 === 'number') {
        this.c2 = c2;
      }
    }
  }
}

export class Matrix2 implements Serializable {
  private a0: number = 0;
  private a1: number = 0;
  private b0: number = 0;
  private b1: number = 0;

  public static from(data: [number, number, number, number]): Matrix2 {
    const m = new Matrix2();
    const [a0, b0, a1, b1] = data;
    m.a0 = a0;
    m.b0 = b0;
    m.a1 = a1;
    m.b1 = b1;
    return m;
  }

  public identity(): Matrix2 {
    this.a0 = 1;
    this.a1 = 0;
    this.b0 = 0;
    this.b1 = 1;
    return this;
  }

  // (1,2) * (2,2) = (1,2)

  public multiplyPoint(x: number): number {
    return x * this.a0 + this.a1;
  }

  public multiply(src: Matrix2, dst?: Matrix2): Matrix2 {
    if (dst === undefined) {
      dst = new Matrix2();
    }

    dst.a0 = this.a0 * src.a0 + this.a1 * src.b0;
    dst.a1 = this.a0 * src.a1 + this.a1 * src.b1;
    dst.b0 = this.b0 * src.a0 + this.b1 * src.b0;
    dst.b1 = this.b0 * src.a1 + this.b1 * src.b1;

    return dst;
  }

  public translate(x: number): Matrix2 {
    this.identity();
    this.a1 = x;
    return this;
  }

  public scale(sx: number): Matrix2 {
    this.identity();
    this.a0 = sx;
    return this;
  }

  public set(src: Matrix2): Matrix2 {
    this.a0 = src.a0;
    this.a1 = src.a1;
    this.b0 = src.b0;
    this.b1 = src.b1;
    return this;
  }

  public fields(a0: number, a1: number): Matrix2 {
    this.identity();
    this.a0 = a0;
    this.a1 = a1;
    return this;
  }

  public toString(): string {
    return `${this.a0},${this.a1}\n${this.b0},${this.b1}`;
  }

  public serialize(): Data {
    return [this.a0, this.a1, this.b0, this.b1];
  }

  public deserialize(data: Data) {
    if (data instanceof Array) {
      const [a0, a1, b0, b1] = data;
      if (typeof a0 === 'number') {
        this.a0 = a0;
      }
      if (typeof a1 === 'number') {
        this.a1 = a1;
      }
      if (typeof b0 === 'number') {
        this.b0 = b0;
      }
      if (typeof b1 === 'number') {
        this.b1 = b1;
      }
    }
  }

  public chain(a0: number, a1: number) {
    this.a0 *= a0;
    this.a1 += a1;
  }
}
