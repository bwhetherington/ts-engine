import {AlertEvent} from '.';

type Sender = (alert: AlertEvent, target: number) => void;

export class AlertManager {
  private sender?: Sender;

  public initialize(sender: Sender) {
    this.sender = sender;
  }

  public send(message: string, target: number = -1) {
    this.sender?.(
      {
        message,
      },
      target
    );
  }
}
