import { GameWorker } from "./util";

function none<T>(): T | undefined {
  return undefined;
}

export class WorkerManager {
  public spawner: (path: string) => GameWorker | undefined = none;

  public spawn(path: string): GameWorker | undefined {
    return this.spawner(path);
  }
}