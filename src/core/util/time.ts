export type TimerHandler = (dt: number) => void;

export abstract class AbstractTimer {
  protected onTick: TimerHandler;

  constructor(onTick: TimerHandler) {
    this.onTick = onTick;
  }

  public abstract async start(): Promise<void>;

  public abstract async stop(): Promise<void>;
}

export async function sleep(time: number): Promise<void> {
  const ms = time * 1000;
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
