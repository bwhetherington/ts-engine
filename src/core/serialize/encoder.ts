export class Encoder {
  private inFloat = new Float32Array(1);
  private inInt = new Uint32Array(1);

  private outInt = new Uint32Array(this.inFloat.buffer);
  private outFloat = new Float32Array(this.inInt.buffer);

  public encode(num: number): string {
    this.inFloat[0] = num;
    return this.outInt[0].toString(36);
  }

  public decode(str: string): number {
    const int = parseInt(str, 36);
    this.inInt[0] = int;
    return this.outFloat[0];
  }
}
