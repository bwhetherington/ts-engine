import { AbstractRNG, RNG, BasicRNG } from 'core/random';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export class RNGManager extends AbstractRNG {
  private rng: RNG = new BasicRNG();

  public next(): number {
    const num = this.rng.next();
    return num;
  }

  public seed(seed: number): void {
    this.rng.seed(seed);
  }

  public setRNG(rng: RNG): void {
    this.rng = rng;
  }
}
