export interface GameEvent {
  type: string;
  data: EventData;
}

export function isEvent(x: any): x is GameEvent {
  return (
    typeof x === "object" &&
    x.hasOwnProperty("type") &&
    typeof x.type === "string" &&
    x.hasOwnProperty("data") &&
    typeof x.data === "object"
  );
}

export interface EventData {
  [key: string]: any;
}
