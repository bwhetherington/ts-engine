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

  set(v: Vector): void {
    this.setXY(v.x, v.y);
  }

  setXY(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  add(v: Vector, scale: number = 1): void {
    this.addXY(v.x, v.y, scale);
  }

  addXY(dx: number, dy: number, scale: number = 1): void {
    this.x += dx * scale;
    this.y += dy * scale;
  }
}

export default Vector;
