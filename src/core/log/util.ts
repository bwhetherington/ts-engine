export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type LogPriorities = {
  [level in LogLevel]: number;
};

const LOG_PRIORITIES: LogPriorities = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function getLevelPriority(level: LogLevel): number {
  return LOG_PRIORITIES[level];
}

const DEFAULT_LEVEL = 'debug';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', DATE_OPTIONS);

export abstract class AbstractLogger {
  public get level(): LogLevel {
    return this.levelInternal;
  }

  public set level(val: LogLevel) {
    this.levelInternal = val;
    this.priotityInternal = getLevelPriority(val);
  }

  private priotityInternal: number = getLevelPriority(DEFAULT_LEVEL);
  private levelInternal: LogLevel = DEFAULT_LEVEL;
  private tags: string[] = [];

  public addTag(tag: string): void {
    this.tags.push(tag);
  }

  public setTags(tags: string[]): void {
    this.tags = [];
  }

  public setLogLevel(level: LogLevel) {
    const priority = getLevelPriority(level);
    this.priotityInternal = priority;
    this.levelInternal = level;
  }

  public getDate(): number {
    return Date.now();
  }

  private formatTags(tags: string[]): string {
    return tags.map((x) => '[' + x + ']').join(' ');
  }

  public format(level: LogLevel, date: number, message: string): string {
    const dateFormat = DATE_FORMAT.format(new Date(date));
    const prefix = this.formatTags([dateFormat, ...this.tags, level]);
    return prefix + ' ' + message;
  }

  public log(
    level: LogLevel,
    message: string,
    method = this.logRaw.bind(this)
  ): void {
    // Check level
    if (getLevelPriority(level) <= this.priotityInternal) {
      // Only log if
      const date = this.getDate();
      const text = this.format(level, date, message);
      method(text);
    }
  }

  public abstract logRaw(...text: string[]): void;

  public logRawError(...text: string[]) {
    this.logRaw(...text);
  }

  public logRawWarn(...text: string[]) {
    this.logRaw(...text);
  }

  public error(message: string): void {
    this.log('error', message, this.logRawError.bind(this));
  }

  public warn(message: string): void {
    this.log('warn', message, this.logRawWarn.bind(this));
  }

  public info(message: string): void {
    this.log('info', message);
  }

  public debug(message: string): void {
    this.log('debug', message);
  }
}
