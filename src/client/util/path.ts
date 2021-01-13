import {Iterator} from 'core/iterator';

const SEPARATOR = /\/+/;

export function join(...parts: string[]): string {
  return Iterator.array(parts)
    .flatMap((part) => part.split(SEPARATOR))
    .filter((part) => part.length > 0)
    .toArray()
    .join('/');
}

export function stripPrefix(path: string, ...prefixParts: string[]): string | undefined {
  const prefix = join(...prefixParts) + '/';
  const index = path.indexOf(prefix);
  
  if (index < 0) {
    return undefined;
  }

  const realIndex = index + prefix.length;
  return path.substring(realIndex);
}
