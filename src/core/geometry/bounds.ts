import {Bounded, Rectangle, Vector, Matrix3} from 'core/geometry';

function maxAndMin(
  a: number,
  b: number,
  c: number,
  d: number,
  dst: Vector = new Vector()
): Vector {
  const min = Math.min(a, b, c, d);
  const max = Math.max(a, b, c, d);
  dst.setXY(min, max);
  return dst;
}

export class Bounds implements Bounded {
  public boundingBox: Rectangle = new Rectangle();
  private isEmptyInternal: boolean = true;
  private dst: Vector = new Vector();

  public insertRawTransformed(
    x: number,
    y: number,
    width: number,
    height: number,
    matrix: Matrix3,
    verbose: boolean = false
  ): void {
    // Transform rectangle
    const {x: x0, y: y0} = matrix.multiplyPointXY(x, y, this.dst);
    const {x: x1, y: y1} = matrix.multiplyPointXY(x + width, y, this.dst);
    const {x: x2, y: y2} = matrix.multiplyPointXY(x, y + height, this.dst);
    const {x: x3, y: y3} = matrix.multiplyPointXY(
      x + width,
      y + height,
      this.dst
    );

    // Compute bounds of transformed rectangle
    const {x: minX, y: maxX} = maxAndMin(x0, x1, x2, x3, this.dst);
    const {x: minY, y: maxY} = maxAndMin(y0, y1, y2, y3, this.dst);

    // Insert transformed bounding box
    this.insertRaw(minX, minY, maxX - minX, maxY - minY, verbose);
  }

  public insertRaw(
    x: number,
    y: number,
    width: number,
    height: number,
    verbose: boolean = false
  ): void {
    if (this.isEmptyInternal) {
      this.boundingBox.x = x;
      this.boundingBox.y = y;
      this.boundingBox.width = width;
      this.boundingBox.height = height;
      this.isEmptyInternal = false;
    } else {
      let newX = this.boundingBox.x;
      let newY = this.boundingBox.y;
      let newWidth = this.boundingBox.width;
      let newHeight = this.boundingBox.height;
      const {x: nearX1, y: nearY1, farX: farX1, farY: farY1} = this.boundingBox;
      const nearX2 = x;
      const nearY2 = y;
      const farX2 = x + width;
      const farY2 = y + height;
      if (nearX2 < nearX1) {
        newWidth += nearX1 - nearX2;
        newX = nearX2;
      }
      if (farX2 > farX1) {
        newWidth += farX2 - farX1;
      }
      if (nearY2 < nearY1) {
        newHeight += nearY1 - nearY2;
        newY = nearY2;
      }
      if (farY2 > farY1) {
        newHeight += farY2 - farY1;
      }
      this.boundingBox.x = newX;
      this.boundingBox.y = newY;
      this.boundingBox.width = newWidth;
      this.boundingBox.height = newHeight;
    }
  }

  public insert(box: Rectangle): void {
    const {x, y, width, height} = box;
    this.insertRaw(x, y, width, height);
  }

  public clear(): void {
    this.boundingBox.x = 0;
    this.boundingBox.y = 0;
    this.boundingBox.width = 0;
    this.boundingBox.height = 0;
    this.isEmptyInternal = true;
  }

  public isEmpty(): boolean {
    return this.isEmptyInternal;
  }
}
