export interface Data {
  [key: string]: any;
}

export interface Serializable {
  serialize(): Data;
  deserialize(data: Data): void;
}
