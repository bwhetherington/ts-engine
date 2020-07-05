export class Rectangle {
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

  public containsPointXY(x: number, y: number): boolean {
    return this.x < x && x < this.farX && this.y < y && y < this.farY;
  }

  private intersectsPartial(other: Rectangle): boolean {
    const { x, y, farX, farY } = other;
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
    const { x, y, farX, farY } = other;
    return (
      this.containsPointXY(x, y) &&
      this.containsPointXY(farX, y) &&
      this.containsPointXY(x, farY) &&
      this.containsPointXY(farX, farY)
    );
  }
}
