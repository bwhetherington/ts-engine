export enum KeyAction {
  KeyDown,
  KeyUp,
}

export enum Key {
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
  N0,
  N1,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  Space,
  Tab,
  Shift,
  Control,
  Enter,
  Backspace,
  Meta,
  Alt,
  Up,
  Down,
  Left,
  Right,
}

export const KEY_MAP: Record<string, Key> = {
  KeyA: Key.A,
  KeyB: Key.B,
  KeyC: Key.C,
  KeyD: Key.D,
  KeyE: Key.E,
  KeyF: Key.F,
  KeyG: Key.G,
  KeyH: Key.H,
  KeyI: Key.I,
  KeyJ: Key.J,
  KeyK: Key.K,
  KeyL: Key.L,
  KeyM: Key.M,
  KeyN: Key.N,
  KeyO: Key.O,
  KeyP: Key.P,
  KeyQ: Key.Q,
  KeyR: Key.R,
  KeyS: Key.S,
  KeyT: Key.T,
  KeyU: Key.U,
  KeyV: Key.V,
  KeyW: Key.W,
  KeyX: Key.X,
  KeyY: Key.Y,
  KeyZ: Key.Z,
  Digit0: Key.N0,
  Digit1: Key.N1,
  Digit2: Key.N2,
  Digit3: Key.N3,
  Digit4: Key.N4,
  Digit5: Key.N5,
  Digit6: Key.N6,
  Digit7: Key.N7,
  Digit8: Key.N8,
  Digit9: Key.N9,
  Space: Key.Space,
  ShiftLeft: Key.Shift,
  ShiftRight: Key.Shift,
  ControlLeft: Key.Control,
  ControlRigt: Key.Control,
  MetaLeft: Key.Meta,
  MetaRight: Key.Meta,
  AltLeft: Key.Alt,
  AltRight: Key.Alt,
  Backspace: Key.Backspace,
  Tab: Key.Tab,
  Enter: Key.Enter,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
};

export interface KeyEvent {
  action: KeyAction;
  key: Key;
}

export enum MouseAction {
  Move,
  Drag,
  Enter,
  Exit,
  ButtonDown,
  ButtonUp,
}

export enum MouseButton {
  Left,
  Right,
}

export const BUTTON_MAP: Record<number, MouseButton> = {
  0: MouseButton.Left,
  2: MouseButton.Right,
};

export interface MouseEvent {
  action: MouseAction;
  x: number;
  y: number;
  button?: MouseButton;
}

export enum MovementDirection {
  Up,
  Down,
  Left,
  Right,
}

export const MOVEMENT_DIRECTION_MAP: Partial<Record<Key, MovementDirection>> = {
  [Key.W]: MovementDirection.Up,
  [Key.A]: MovementDirection.Left,
  [Key.S]: MovementDirection.Down,
  [Key.D]: MovementDirection.Right,
};

export * from 'core/input/controller';
export * from 'core/input/player';
