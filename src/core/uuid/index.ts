import { UUIDManager } from 'core/uuid/manager';

export type UUID = string;

const UM = new UUIDManager();
export { UM as UUIDManager };
