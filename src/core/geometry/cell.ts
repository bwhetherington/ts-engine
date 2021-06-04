import {GraphicsContext} from 'core/graphics';
import {Rectangle, Partioner, Bounded} from 'core/geometry';
import {BLACK, WHITE} from 'core/graphics/color';

export class Cell<T extends Bounded> extends Partioner<T> {
  private cells: T[][] = [];

  private cellWidth: number;
  private cellHeight: number;

  private width: number = 1;
  private height: number = 1;
  private size: number = 0;

  public constructor(bounds: Rectangle, cellWidth: number, cellHeight: number) {
    super(bounds);
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.initializeSize(bounds);
  }

  private initializeSize(bounds: Rectangle): void {
    this.boundingBox = bounds;
    this.width = Math.ceil(bounds.width / this.cellWidth) + 1;
    this.height = Math.ceil(bounds.height / this.cellHeight) + 1;
  }

  public resize(bounds: Rectangle): void {
    const elements = this.getAll();
    this.cells = [];
    this.initializeSize(bounds);
    for (const element of elements) {
      this.insert(element);
    }
  }

  private getAll(): Set<T> {
    const elements = new Set<T>();
    for (const cell of this.cells) {
      if (cell) {
        for (const element of cell) {
          elements.add(element);
        }
      }
    }
    return elements;
  }

  private getCell(index: number): T[] {
    let cell = this.cells[index];
    if (!cell) {
      cell = [];
      this.cells[index] = cell;
    }
    return cell;
  }

  private getRow(y: number): number {
    return Math.floor((y - this.boundingBox.y) / this.cellHeight);
  }

  private getCol(x: number): number {
    return Math.floor((x - this.boundingBox.x) / this.cellWidth);
  }

  public insert(element: T): void {
    // Insert element into each cell it occupies
    const {x, y, farX, farY} = element.boundingBox;

    for (let j = this.getRow(y); j <= this.getRow(farY); j += 1) {
      for (let i = this.getCol(x); i <= this.getCol(farX); i++) {
        const index = j * this.width + i;
        const cell = this.getCell(index);
        cell.push(element);
      }
    }

    this.size += 1;
  }

  private *queryInternal(area: Rectangle): Iterable<T> {
    const {x, y, farX, farY} = area;

    for (let j = this.getRow(y); j <= this.getRow(farY); j += 1) {
      for (let i = this.getCol(x); i <= this.getCol(farX); i++) {
        const index = j * this.width + i;
        const cell = this.getCell(index);
        for (const element of cell) {
          yield element;
        }
      }
    }
  }

  public query(area: Rectangle): Set<T> {
    const set = new Set<T>();
    for (const element of this.queryInternal(area)) {
      set.add(element);
    }
    return set;
  }

  public queryPointXY(x: number, y: number): Set<T> {
    const row = this.getRow(y);
    const col = this.getCol(x);
    return new Set(this.getCell(row * this.width + col));
  }

  public render(ctx: GraphicsContext): void {
    ctx.pushOptions({
      lineWidth: 1,
      doFill: false,
    });

    for (let col = 0; col < this.width; col++) {
      for (let row = 0; row < this.height; row++) {
        const cell = this.cells[row * this.width + col] ?? [];
        const color = cell.length > 0 ? BLACK : WHITE;

        if (cell.length > 0) {
          ctx.pushOptions({
            lineWidth: 1,
            doFill: true,
          });
        }

        const x = col * this.cellWidth + this.boundingBox.x;
        const y = row * this.cellHeight + this.boundingBox.y;
        ctx.rect(x, y, this.cellWidth, this.cellHeight, color);

        if (cell.length > 0) {
          ctx.popOptions();
        }
      }
    }

    ctx.popOptions();
  }

  public clear(): void {
    this.cells = [];
    this.size = 0;
  }

  public getSize(): number {
    return this.size;
  }
}
