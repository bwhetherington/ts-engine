export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

type LogPriorities = {
  [level in LogLevel]: number;
};

const LOG_PRIORITIES: LogPriorities = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

function getLevelPriority(level: LogLevel): number {
  return LOG_PRIORITIES[level];
}

const DEFAULT_LEVEL = 'trace';

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

  public meetsLogLevel(logLevel: LogLevel, currentLevel?: LogLevel): boolean {
    const levelToMeet = currentLevel
      ? getLevelPriority(currentLevel)
      : this.getPriority();
    return getLevelPriority(logLevel) <= levelToMeet;
  }

  public addTag(tag: string) {
    this.tags.push(tag);
  }

  public setTags(tags: string[]) {
    this.tags = [];
  }

  public setLogLevel(level: LogLevel) {
    const priority = getLevelPriority(level);
    this.priotityInternal = priority;
    this.levelInternal = level;
  }

  public getLogLevel(): LogLevel {
    return this.levelInternal;
  }

  public getDate(): number {
    return Date.now();
  }

  private formatTags(tags: string[]): string {
    return tags.map((tag) => `[${tag}]`).join(' ');
  }

  public format(level: LogLevel, date: number, message: string): string {
    const dateFormat = DATE_FORMAT.format(new Date(date));
    const prefix = this.formatTags([
      dateFormat,
      ...this.tags,
      level.toUpperCase(),
    ]);
    return prefix + ' ' + message;
  }

  public log(
    level: LogLevel,
    message: string,
    method = this.logRaw.bind(this)
  ) {
    // Check level
    if (this.meetsLogLevel(level)) {
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

  public error(message: string) {
    this.log('error', message, this.logRawError.bind(this));
  }

  public warn(message: string) {
    this.log('warn', message, this.logRawWarn.bind(this));
  }

  public info(message: string) {
    this.log('info', message);
  }

  public debug(message: string) {
    this.log('debug', message);
  }

  public trace(message: string) {
    this.log('trace', message);
  }

  public getPriority(): number {
    return this.priotityInternal;
  }
}
