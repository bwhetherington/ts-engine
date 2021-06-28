import {Data, Serializable} from 'core/serialize';
import {EventManager, Priority, StepEvent} from 'core/event';
import {Rectangle} from 'core/geometry';
import {CameraManager, GameImage, PIXEL_SIZE, Renderable} from 'core/graphics';
import {GraphicsContext} from './context';
import {Iterator} from 'core/iterator';
import {AssetManager} from 'core/assets';
import {HDCanvas} from 'client/util';

type TileId = number;

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  return canvas;
}

export class TileManager implements Renderable {
  private tileAtlas_?: GameImage;
  private data_: TileId[] = [];
  private tileSize_: number = 16;
  private rows_: number = 0;
  private cols_: number = 0;
  private chunkSize_: number = 0;
  private cameraBounds_: Rectangle = new Rectangle(0, 0, 0, 0);
  private buffer_?: HTMLCanvasElement;

  constructor() {
    // EventManager.streamEvents<StepEvent>(
    //   'StepEvent',
    //   Priority.High
    // ).forEach(() => this.updateCamera());
  }

  public get rows() {
    return this.rows_;
  }

  public get cols() {
    return this.cols_;
  }

  public get chunkSize() {
    return this.chunkSize_;
  }

  public get tileSize() {
    return this.tileSize_;
  }

  private updateCamera() {
    const {tileSize} = this;
    const {x, y, width, height} = CameraManager.boundingBox;
    this.cameraBounds_.x = x / tileSize;
    this.cameraBounds_.y = y / tileSize;
    this.cameraBounds_.width = width / tileSize;
    this.cameraBounds_.height = height / tileSize;
  }

  private getChunkCoordinatesXY(x: number, y: number): number {
    return x;
  }

  private updateBuffer(): HTMLCanvasElement | undefined {
    // const {x, y, farX, farY} = CameraManager.boundingBox;

    if (!this.buffer_) {
      this.buffer_ = createCanvas(
        this.cols * this.tileSize,
        this.rows * this.tileSize
      );
    }

    const ctx = this.buffer_.getContext('2d');
    if (!ctx) {
      return;
    }

    const atlas = this.tileAtlas_;
    if (!atlas) {
      return;
    }

    Iterator.array(this.data_)
      .enumerate()
      .map(([tile, index]) => [
        tile,
        Math.trunc(index % this.cols),
        Math.trunc(index / this.cols),
      ])
      .forEach(([tile, x, y]) => {
        this.renderTile(ctx, atlas, tile, x, y);
      });

    return this.buffer_;

    // Compute chunk coordinates of each corner
  }

  public render(ctx: GraphicsContext) {
    let buf = this.buffer_;
    if (!this.buffer_) {
      buf = this.updateBuffer();
    }

    if (!buf) {
      return;
    }

    // ctx.spriteImage(buf, 0, 0);

    ctx.image(
      buf,
      0,
      0,
      this.cols * this.tileSize * PIXEL_SIZE,
      this.rows * this.tileSize * PIXEL_SIZE,
      0,
      0,
      this.cols * this.tileSize,
      this.rows * this.tileSize
    );
  }

  private renderTile(
    ctx: CanvasRenderingContext2D,
    atlas: GameImage,
    tile: number,
    x: number,
    y: number
  ): void {
    ctx.drawImage(
      atlas,
      tile * this.tileSize,
      0,
      this.tileSize,
      this.tileSize,
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }

  private renderTileAtlas(images: GameImage[]): GameImage | undefined {
    if (images.length === 0) {
      return;
    }

    const size = this.tileSize;
    const w = size * images.length;
    const h = size;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');

    if (ctx) {
      Iterator.array(images)
        .enumerate()
        .forEach(([image, i]) => {
          const x = i * size;
          ctx.drawImage(image, x, 0);
        });
    }

    return canvas;
  }

  public async load(path: string): Promise<void> {
    const inputData = await AssetManager.loadJSON(path);
    const {tiles, width, height, data} = inputData;
    if (typeof width === 'number') {
      this.cols_ = width;
    }
    if (typeof height === 'number') {
      this.rows_ = height;
    }
    if (data instanceof Array) {
      if (data.every((val) => typeof val === 'number')) {
        this.data_ = data;
      }
    }
    if (tiles instanceof Array) {
      const imagePromises = Iterator.array(tiles)
        .filterMap((x) => {
          if (typeof x === 'string') {
            return x;
          }
        })
        .map((path) => AssetManager.loadImage(path));
      const loadedImages = await Promise.all(imagePromises);
      this.tileAtlas_ = this.renderTileAtlas(loadedImages);
      this.updateBuffer();
    }
  }
}
