export type Maybe<T> = T | undefined;

export function map<T, U>(maybe: Maybe<T>, f: (_: T) => U): Maybe<U> {
  if (maybe !== undefined) {
    return f(maybe);
  }
}
