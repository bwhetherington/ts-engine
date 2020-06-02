import { AbstractLogger } from "../../shared/util/log";

class Logger extends AbstractLogger {
  public logRaw(...text: string[]): void {
    console.log(...text);
  }
}

const logger = new Logger();
export default logger;
