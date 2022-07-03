import {Data, Serializable, SerializableType} from '.';

const PRIMITIVE_TYPES = new Set(['number', 'string', 'boolean']);

export function serialize(serializable: SerializableType): any {
  const type = typeof serializable;
  if (PRIMITIVE_TYPES.has(type)) {
    return serializable;
  }
  if (typeof (serializable as any).serialize === 'function') {
    return (serializable as any).serialize();
  }
  const output: Data = {};
  if (serializable instanceof Map) {
    for (const [key, value] of serializable.entries()) {
      output[key] = serialize(value);
    }
  } else {
    for (const [key, value] of Object.entries(serializable)) {
      output[key] = (value as Serializable).serialize();
    }
  }
  return output;
}

export function deserializeMapString(src: Data, dst: Map<string, string>) {
  for (const [key, value] of Object.entries(src)) {
    if (typeof value === 'string') {
      dst.set(key, value);
    }
  }
}

export function deserializeMapNumber(src: Data, dst: Map<string, number>) {
  for (const [key, value] of Object.entries(src)) {
    if (typeof value === 'number') {
      dst.set(key, value);
    }
  }
}
