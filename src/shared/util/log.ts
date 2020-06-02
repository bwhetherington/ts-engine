export type LogLevel = "error" | "warn" | "info";

export abstract class AbstractLogger {
  public getDate(): number {
    return Date.now();
  }

  public format(level: LogLevel, date: number, message: string): string[] {
    const dateFormat = new Date(date).toISOString();
    return [`[${dateFormat}]`, `[${level}]`, message];
  }

  public log(level: LogLevel, message: string): void {
    const date = this.getDate();
    const text = this.format(level, date, message);
    this.logRaw(...text);
  }

  protected abstract logRaw(...text: string[]): void;

  public error(message: string): void {
    this.log("error", message);
  }

  public warn(message: string): void {
    this.log("warn", message);
  }

  public info(message: string): void {
    this.log("info", message);
  }
}
