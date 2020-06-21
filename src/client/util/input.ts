export type KeyAction = "keydown" | "keyup";

export interface KeyEvent {
  key: string;
}

class InputManager {
  private element?: HTMLElement;

  constructor() {}

  public initialize(element: HTMLElement): void {
    this.element = element;
    this.element?.addEventListener("keydown", (event) => {
      event.key;
    });
  }
}

export const CM = new InputManager();
