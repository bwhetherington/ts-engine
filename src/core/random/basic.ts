import {AbstractRNG} from 'core/random';

const A: number = 1664525;
const C: number = 1013904223;
const M: number = 4294967296;

export class BasicRNG extends AbstractRNG {
  private current: number = 0;

  public constructor() {
    super();
    this.seed(0);
  }

  public seed(seed: number) {
    this.current = seed;
  }

  public next(): number {
    this.current = (A * this.current + C) % M;
    return this.current / M;
  }
}
