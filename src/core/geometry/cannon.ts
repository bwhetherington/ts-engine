import {Data, Serializable} from '@/core/serialize';

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
      angle: (this.angle * 180) / Math.PI,
    };
    if (this.farHeight !== undefined) {
      obj.farHeight = this.farHeight;
    }
    return obj;
  }

  public deserialize(data: Data) {
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
      this.angle = (angle * Math.PI) / 180;
    }
  }

  public getTip(
    x: number = 0,
    y: number = 0,
    angle: number = 0,
    dst: Vector = new Vector(0, 0)
  ): Vector {
    dst.setXY(x, y);
    const baseAngle = angle + this.angle;
    const tipX = this.offset.x + this.length;
    const tipY = this.offset.y;

    const dist = Math.sqrt(tipX * tipX + tipY * tipY);
    const offsetAngle = Math.atan2(tipY, tipX);

    const dx = dist * Math.cos(baseAngle + offsetAngle);
    const dy = dist * Math.sin(baseAngle + offsetAngle);

    dst.addXY(dx, dy);
    return dst;
  }
}
