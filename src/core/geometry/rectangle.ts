import {Data, Serializable} from 'core/serialize';
import {Vector, VectorLike} from 'core/geometry';
import {DataBuffer, DataSerializable} from 'core/buf';
import {Iterator} from 'core/iterator';

export interface RectangleLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Rectangle
  implements DataSerializable, Serializable, RectangleLike {
  private vertices: Vector[] = [
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
  ];

  constructor(
    width: number = 0,
    height: number = 0,
    x: number = 0,
    y: number = 0
  ) {
    this.updateVertices(x, y, width, height);
  }

  public get x(): number {
    return this.vertices[0].x;
  }

  public get y(): number {
    return this.vertices[0].y;
  }

  public get width(): number {
    return this.vertices[2].x - this.vertices[0].x;
  }

  public get height(): number {
    return this.vertices[2].y - this.vertices[0].y;
  }

  public set x(newX: number) {
    this.updateVertices(newX, this.y, this.width, this.height);
  }

  public set y(newY: number) {
    this.updateVertices(this.x, newY, this.width, this.height);
  }

  public set width(newWidth: number) {
    this.updateVertices(this.x, this.y, newWidth, this.height);
  }

  public set height(newHeight: number) {
    this.updateVertices(this.x, this.y, this.width, newHeight);
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

  private updateVertices(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    this.vertices[0].setXY(x, y);
    this.vertices[1].setXY(x + width, y);
    this.vertices[2].setXY(x + width, y + height);
    this.vertices[3].setXY(x, y + height);
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

  public setCenterXY(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  public setCenter(v: VectorLike): void {
    this.setCenterXY(v.x, v.y);
  }

  public containsPointXY(x: number, y: number): boolean {
    return this.x < x && x < this.farX && this.y < y && y < this.farY;
  }

  private intersectsPartial(other: Rectangle): boolean {
    const {x, y, farX, farY} = other;
    return (
      this.containsPointXY(x, y) ||
      this.containsPointXY(farX, y) ||
      this.containsPointXY(x, farY) ||
      this.containsPointXY(farX, farY)
    );
  }

  public intersects(other: Rectangle): boolean {
    const {x: x1, y: y1, farX: fx1, farY: fy1} = this;
    const {x: x2, y: y2, farX: fx2, farY: fy2} = other;

    if (fx1 < x2 || fx2 < x1) {
      return false;
    }

    if (fy1 < y2 || fy2 < y1) {
      return false;
    }

    return true;

    // return this.intersectsPartial(other) || other.intersectsPartial(this);
  }

  public contains(other: Rectangle): boolean {
    const {x, y, farX, farY} = other;
    return (
      this.containsPointXY(x, y) &&
      this.containsPointXY(farX, y) &&
      this.containsPointXY(x, farY) &&
      this.containsPointXY(farX, farY)
    );
  }

  public serialize(): Data {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  public deserialize(data: Data): void {
    const {x, y, width, height} = data;
    if (typeof x === 'number') {
      this.x = x;
    }
    if (typeof y === 'number') {
      this.y = y;
    }
    if (typeof width === 'number') {
      this.width = width;
    }
    if (typeof height === 'number') {
      this.height = height;
    }
  }

  public dataSize(): number {
    return 16;
  }

  public dataSerialize(buf: DataBuffer): void {
    buf.writeFloat(this.x);
    buf.writeFloat(this.y);
    buf.writeFloat(this.width);
    buf.writeFloat(this.height);
  }

  public dataDeserialize(buf: DataBuffer): void {
    const x = buf.readFloat();
    const y = buf.readFloat();
    const w = buf.readFloat();
    const h = buf.readFloat();
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  public getVertices(): Iterator<Vector> {
    return Iterator.array(this.vertices);
  }

  public getEdges(): Iterator<Vector> {
    const edgeIndices = Iterator.range(0, 4);
    const edgeIndices2 = Iterator.range(0, 4).map((i) => (i + 1) % 4);
    return edgeIndices.zipWith(edgeIndices2, (i, j) => {
      const a = this.vertices[i];
      const b = this.vertices[j];
      return new Vector(a.x - b.x, a.y - b.y);
    });
  }

  public getEdgeNormals(): Iterator<Vector> {
    return this.getEdges().map((edge) => {
      const norm = edge.perp();
      norm.normalize();
      return norm;
    });
  }

  public project(axis: Vector): Vector {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    this.getVertices().forEach((vert) => {
      const p = axis.dot(vert);
      if (p < min) {
        min = p;
      } else if (p > max) {
        max = p;
      }
    });

    return new Vector(min, max);
  }

  public static testCollision(a: Rectangle, b: Rectangle): Vector | undefined {
    const axes1 = a.getEdgeNormals().take(2);
    const axes2 = b.getEdgeNormals().take(2);

    let overlap = Number.MAX_VALUE;
    let smallestAxis: Vector | undefined;

    for (const axis of axes1) {
      const p1 = a.project(axis);
      const p2 = b.project(axis);

      if (!p1.overlap(p2)) {
        return;
      }

      const o = p1.getOverlap(p2);
      if (o < overlap) {
        overlap = o;
        smallestAxis = axis;
      }
    }

    for (const axis of axes2) {
      const p1 = a.project(axis);
      const p2 = b.project(axis);

      let o = p1.getOverlap(p2);

      if (o < 0) {
        return;
      }

      if (p1.contains(p2) || p2.contains(p1)) {
        const mins = Math.abs(p1.x - p2.x);
        const maxs = Math.abs(p1.y - p2.y);
        if (mins < maxs) {
          o += mins;
        } else {
          o += maxs;
        }
      }

      if (o < overlap) {
        overlap = o;
        smallestAxis = axis;
      }
    }

    if (!smallestAxis) {
      return;
    }

    const mtv = new Vector();
    mtv.add(smallestAxis, overlap);

    return mtv;
  }
}
