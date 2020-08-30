export class Encoder {
  private floatBuf: Float32Array = new Float32Array(1);
  private byteBuf: Uint8Array = new Uint8Array(4);

  public encode(num: number): string {
    this.floatBuf[0] = num;
    this.byteBuf = new Uint8Array(this.floatBuf.buffer);

    let str = '';
    for (let i = 0; i < this.byteBuf.length; i++) {
      str += String.fromCharCode(this.byteBuf[i]);
    }

    return str;
  }

  public decode(str: string): number {
    for (let i = 0; i < 4; i++) {
      this.byteBuf[i] = str.charCodeAt(i);
    }
    this.floatBuf = new Float32Array(this.byteBuf.buffer);
    return this.floatBuf[0];
  }
}
