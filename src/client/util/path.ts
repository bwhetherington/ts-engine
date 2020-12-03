import { Iterator } from "core/iterator";

const SEPARATOR = /\/+/;

export function join(...parts: string[]): string {
  return Iterator.array(parts)
    .flatMap((part) => Iterator.array(part.split(SEPARATOR)))
    .filter((part) => part.length > 0)
    .toArray()
    .join('/');
}