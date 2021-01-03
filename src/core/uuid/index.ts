import {UUIDManager} from 'core/uuid/manager';

export type UUID = number;

const UM = new UUIDManager();
export {UM as UUIDManager};
