import { DataBuffer } from "./buffer";

export interface DataSerializable {
  dataSize(): number;
  dataSerialize(buf: DataBuffer): DataBuffer;
  dataDeserialize(buf: DataBuffer): void;
}