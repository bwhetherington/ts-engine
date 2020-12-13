export * from 'core/iterator/sync';
export * from 'core/iterator/async';

export type Iterable<T> = T[] | Set<T> | Generator<T>;