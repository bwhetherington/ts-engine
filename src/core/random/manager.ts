import {AbstractRNG, RNG, BasicRNG} from '@/core/random';

export class RNGManager extends AbstractRNG {
  private rng: RNG = new BasicRNG();

  public next(): number {
    const num = this.rng.next();
    return num;
  }

  public seed(seed: number) {
    this.rng.seed(seed);
  }

  public setRNG(rng: RNG) {
    this.rng = rng;
  }
}
