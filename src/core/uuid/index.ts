import {UUIDManager} from 'core/uuid/manager';

export type UUID = number;

export function isUUID(x: unknown): x is UUID {
  return typeof x === 'number';
}

const UM = new UUIDManager();
export {UM as UUIDManager};
