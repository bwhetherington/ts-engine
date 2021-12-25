import {AbstractLogger} from 'core/log';

export class ServerLogger extends AbstractLogger {
  public logRaw(...text: string[]) {
    console.log(...text);
  }
}
