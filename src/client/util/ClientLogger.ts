import { AbstractLogger } from 'core/util/log';

class ClientLogger extends AbstractLogger {
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

export default ClientLogger;
