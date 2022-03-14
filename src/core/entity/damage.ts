export enum DamageType {
  Physical = 0,
  Energy = 1,
  Pure = 2,
}

export function serializeDamageType(type: DamageType): number {
  return type;
}

export function deserializeDamageType(type: number): DamageType {
  return type as DamageType;
}