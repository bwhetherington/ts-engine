import {EventManager} from '@/core/event';
import {Data} from '@/core/serialize';

import {Effect} from '.';

export class IntervalEffect extends Effect {
  public static typeName: string = 'IntervalEffect';

  private _interval: number = 1;
  private counter: number = 0;

  public get interval() {
    return this._interval;
  }

  public set interval(val) {
    this._interval = val;
    this.counter = EventManager.timeElapsed % val;
  }

  constructor() {
    super();
    this.interval = this._interval;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      interval: this.interval,
    };
  }

  public override deserialize(data: Data, initialize?: boolean) {
    super.deserialize(data, initialize);
    const {interval} = data;
    if (typeof interval === 'number') {
      this.interval = interval;
    }
  }

  public override step(dt: number) {
    super.step(dt);
    this.counter += dt;
    while (this.counter >= this.interval) {
      this.counter -= this.interval;
      this.run();
    }
  }

  protected run() {}
}
