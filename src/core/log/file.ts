import {LoggerWrapper} from '@/core/log';
// import path from 'path';

// function findRelativePath(fileName: string): string {
//   const file = path.resolve(fileName);
//   const parts = file.split(path.sep);
//   const index = parts.indexOf('src');
//   if (index > -1) {
//     return parts.slice(index + 1).join(path.sep);
//   } else {
//     return file;
//   }
// }

export class FileLogger extends LoggerWrapper {
  private static fileNames: Set<string> = new Set();

  public constructor(fileName: string) {
    super();
    this.addTag(fileName);
  }

  public override logRaw(content: string) {
    this.logger?.logRaw(content);
  }
}
