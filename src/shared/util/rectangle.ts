class Rectangle {
  constructor(
    public width: number = 0,
    public height: number = 0,
    public x: number = 0,
    public y: number = 0
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public get centerX(): number {
    return this.x + this.width / 2;
  }

  public get farX(): number {
    return this.x + this.width;
  }

  public get farY(): number {
    return this.y + this.height;
  }

  public get centerY(): number {
    return this.y + this.height / 2;
  }

  public containsPointXY(x: number, y: number): boolean {
    return (this.x < x && x < this.farX) && (this.y < y && y < this.farY);
  }

  public intersects(other: Rectangle): boolean {
    return (
      this.containsPointXY(other.x, other.y) ||
      this.containsPointXY(other.farX, other.y) ||
      this.containsPointXY(other.x, other.farY) ||
      this.containsPointXY(other.farX, other.farY)
    );
  }

  public contains(other: Rectangle): boolean {
    return (
      this.containsPointXY(other.x, other.y) &&
      this.containsPointXY(other.farX, other.y) &&
      this.containsPointXY(other.x, other.farY) &&
      this.containsPointXY(other.farX, other.farY)
    );
  }
}

export default Rectangle;
