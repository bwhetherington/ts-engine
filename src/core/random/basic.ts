import {AbstractRNG} from 'core/random';

const A: number = 1664525;
const C: number = 1013904223;
const M: number = 4294967296;

export class BasicRNG extends AbstractRNG {
  private current: number = 0;

  public constructor() {
    super();
    // this.seed(Date.now());
    this.seed(0);
  }

  public seed(seed: number): void {
    this.current = seed;
    this.next();
  }

  public next(): number {
    this.current = (A * this.current + C) % M;
    return this.current / M;
  }
}
