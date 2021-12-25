import {Message, Socket} from 'core/net';
import {RNGManager} from 'core/random';
import {Server} from './Server';

export class DelayServer extends Server {
  private delays: Record<Socket, number> = {};

  public onConnect(socket: Socket) {
    this.delays[socket] = RNGManager.nextFloat(0.1, 0.2);
    super.onConnect(socket);
  }

  public onDisconnect(socket: Socket) {
    delete this.delays[socket];
    super.onDisconnect(socket);
  }

  private getDelay(socket: Socket): number {
    return RNGManager.nextFloat(0.025, 0.075) * 1000;
    // return (this.delays[socket] ?? 0) * 1000;
  }

  private delayAction(socket: Socket, then: () => void) {
    const delay = this.getDelay(socket);
    if (delay > 0) {
      setTimeout(() => {
        then();
      }, delay);
    } else {
      then();
    }
  }

  protected sendRaw(data: string, socket: Socket) {
    this.delayAction(socket, () => super.sendRaw(data, socket));
  }

  protected receiveRaw(data: string, socket: Socket) {
    this.delayAction(socket, () => super.receiveRaw(data, socket));
  }
}
