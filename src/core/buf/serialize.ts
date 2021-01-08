import { DataBuffer } from "./buffer";

export interface DataSerializable {
  dataSize(): number;
  dataSerialize(buf: DataBuffer): void;
  dataDeserialize(buf: DataBuffer): void;
}