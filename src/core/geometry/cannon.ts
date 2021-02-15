import {Data, Serializable} from 'core/serialize';
import {Vector} from './vector';

export class CannonShape implements Serializable {
  public offset: Vector = new Vector(0, 0);
  public angle: number = 0;

  public constructor(
    public length: number,
    public height: number,
    public farHeight?: number
  ) {}

  public serialize(): Data {
    const obj: Data = {
      length: this.length,
      height: this.height,
      offset: this.offset.serialize(),
      angle: this.angle * 180 / Math.PI,
    };
    if (this.farHeight !== undefined) {
      obj.farHeight = this.farHeight;
    }
    console.log('angle', obj.angle);
    return obj;
  }

  public deserialize(data: Data): void {
    const {length, height, farHeight, offset, angle} = data;
    if (typeof length === 'number') {
      this.length = length;
    }
    if (typeof height === 'number') {
      this.height = height;
    }
    if (typeof farHeight === 'number') {
      this.farHeight = farHeight;
    }
    if (offset) {
      this.offset.deserialize(offset);
    }
    if (typeof angle === 'number') {
      this.angle = angle;
    }
  }
}
