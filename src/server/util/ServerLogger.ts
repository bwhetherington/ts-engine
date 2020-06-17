import { AbstractLogger } from "../../shared/util/log";

class ServerLogger extends AbstractLogger {
  public logRaw(...text: string[]): void {
    console.log(...text);
  }
}

export default ServerLogger;
