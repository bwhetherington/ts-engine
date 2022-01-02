import {UUIDManager} from 'core/uuid/manager';

export type UUID = string;

export function isUUID(x: unknown): x is UUID {
  return typeof x === 'string';
}

const UM = new UUIDManager();
export {UM as UUIDManager};
