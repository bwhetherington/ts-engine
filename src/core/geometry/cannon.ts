import {Data, Serializable} from 'core/serialize';

export class CannonShape implements Serializable {
  public constructor(
    public length: number,
    public height: number,
    public farHeight?: number
  ) {}

  public serialize(): Data {
    const obj: Data = {length: this.length, height: this.height};
    if (this.farHeight !== undefined) {
      obj.farHeight = this.farHeight;
    }
    return obj;
  }

  public deserialize(data: Data): void {
    const {length, height, farHeight} = data;
    if (typeof length === 'number') {
      this.length = length;
    }
    if (typeof height === 'number') {
      this.height = height;
    }
    if (typeof farHeight === 'number') {
      this.farHeight = farHeight;
    }
  }
}
