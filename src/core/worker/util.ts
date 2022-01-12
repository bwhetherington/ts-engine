import {Worker} from 'core/worker';
import {Data} from 'core/serialize';

export class GameWorker {
  private worker: Worker;

  public constructor(worker: Worker) {
    this.worker = worker;
  }

  private setHandler(handler: (arg: any) => void) {
    if (this.worker.on) {
      this.worker.on('message', handler);
    }
    if (this.worker.onmessage !== undefined) {
      // `null` is an okay value here
      this.worker.onmessage = (message: MessageEvent) => handler(message.data);
    }
  }

  public call(method: string, value: any): Promise<any> {
    return new Promise((resolve) => {
      this.worker.postMessage({method, value});
      this.setHandler((event) => resolve(event.data));
    });
  }
}
