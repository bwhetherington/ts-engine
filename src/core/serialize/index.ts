import { SerializeManager } from 'core/serialize/manager';

export interface Data {
  [key: string]: any;
}

export interface Serializable {
  serialize(): Data;
  deserialize(data: Data): void;
}

const SM = new SerializeManager();
export { SM as SerializeManager };
