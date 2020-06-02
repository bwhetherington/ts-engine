export function square(x: number): number {
  return x * x;
}

export type TimerHandler = (dt: number) => void;

export abstract class AbstractTimer {
  protected onTick: TimerHandler;

  constructor(onTick: TimerHandler) {
    this.onTick = onTick;
  }

  public abstract async start(): Promise<void>;

  public abstract async stop(): Promise<void>;
}
