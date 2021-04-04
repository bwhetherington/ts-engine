import {Text, WorldManager, Echo} from 'core/entity';
import {EventManager} from 'core/event';

export class TimedText extends Text {
  public static typeName: string = 'TimedText';

  public duration: number = 0.5;
  public elapsed: number = 0;

  public constructor() {
    super();
    this.type = TimedText.typeName;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.isInitialized = true;
      await EventManager.sleep(1);
      this.markForDelete();
      const echo = WorldManager.spawn(Echo, this.position);
      echo.initialize(this, false, 0.5);
    }
  }
}
