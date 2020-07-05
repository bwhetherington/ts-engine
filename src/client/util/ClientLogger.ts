import { AbstractLogger } from 'core/log';

export class ClientLogger extends AbstractLogger {
  public logRaw(...text: string[]): void {
    console.log(...text);
  }

  public logRawError(...text: string[]): void {
    console.error(...text);
  }

  public logRawWarn(...text: string[]): void {
    console.warn(...text);
  }
}
