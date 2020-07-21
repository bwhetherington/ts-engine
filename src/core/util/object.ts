import { Data } from 'core/serialize';

export function diff(
  from: Data,
  to: Data,
  diffObj: Data,
  include: string[] = []
): boolean {
  let isModified = false;

  for (const key in to) {
    const a = from[key];
    const b = to[key];
    const inequal = a !== b;
    if (inequal) {
      isModified = true;
    }
    if (inequal || include.includes(key)) {
      if (typeof a === 'object') {
        const obj = a instanceof Array ? <any[]>[] : <Data>{};
        if (diff(a, b, obj)) {
          diffObj[key] = obj;
        }
      } else {
        diffObj[key] = b;
      }
    }
  }

  return isModified;
}
