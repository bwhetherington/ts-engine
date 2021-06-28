import {EventManager, Priority, StepEvent} from 'core/event';
import {Rectangle, Vector, VectorLike} from 'core/geometry';
import {CameraManager} from 'core/graphics';
import {Iterator} from 'core/iterator';

export class ChunkManager {
  private chunkSize: number = 16 * 32;
  private loadedChunks: Set<string> = new Set();

  private getCoordinateString({x, y}: VectorLike): string {
    return x + ',' + y;
  }

  private getBounds(): Rectangle {
    return CameraManager.boundingBox;
  }

  private *getChunks_(within: Rectangle): Iterable<Vector> {
    const {x, y, farX, farY} = within;
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    const cFarX = Math.ceil(farX / this.chunkSize);
    const cFarY = Math.ceil(farY / this.chunkSize);

    const vec = new Vector();
    for (let i = cx; i <= cFarX; i++) {
      for (let j = cy; j <= cFarY; j++) {
        vec.setXY(i, j);
        yield vec;
      }
    }
  }

  public getChunks(within: Rectangle): Iterator<Vector> {
    return Iterator.from(this.getChunks_(within));
  }

  public initialize(): void {
    EventManager.streamEvents<StepEvent>('StepEvent', Priority.Highest).map(
      () => 10
    );
  }
}
