import {AbstractLogger} from '@/core/log';

export class ServerLogger extends AbstractLogger {
  public logRaw(...text: string[]) {
    // tslint:disable-next-line
    console.log(...text);
  }
}
