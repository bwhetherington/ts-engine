import {SerializeManager} from '@/core/serialize/manager';

export interface Data {
  [key: string]: any;
}

export interface Serializable {
  serialize(): Data;
  deserialize(data: Data, initialize?: boolean): void;
}

type SerializableAtom = number | boolean | string | Serializable;

export type SerializableType =
  | SerializableAtom
  | Record<string, SerializableAtom>
  | Map<string, SerializableAtom>;

const SM = new SerializeManager();
export {SM as SerializeManager};

export interface UpdateKeysEvent {
  keys: Record<string, number>;
}

export * from '@/core/serialize/util';
export * from '@/core/serialize/encoder';
export * from '@/core/serialize/data';
