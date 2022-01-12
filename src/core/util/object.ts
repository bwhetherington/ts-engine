import {Iterator} from 'core/iterator';
import {Data} from 'core/serialize';

export function isEmpty(obj: object): boolean {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

export function diff(
  from: Data,
  to: Data,
  diffObj: Data,
  include: string[] = []
): boolean {
  let isModified = false;

  for (const key in to) {
    if (from) {
      const a = from[key];
      const b = to[key];
      const inequal = a !== b;
      if (inequal) {
        isModified = true;
      }
      if (inequal || include.includes(key)) {
        if (typeof a === 'object') {
          const obj = a instanceof Array ? ([] as any[]) : ({} as any);
          if (diff(a, b, obj)) {
            diffObj[key] = obj;
          }
        } else {
          diffObj[key] = b;
        }
      }
    }
  }

  Iterator.entries(diffObj).forEach(([key, val]) => {
    if (typeof val === 'object' && Object.keys(val).length === 0) {
      delete diffObj[key];
    }
  });

  return isModified;
}
