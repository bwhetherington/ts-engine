class Vector {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.setXY(x, y);
  }

  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  set(v: Vector) {
    this.setXY(v.x, v.y);
  }

  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
