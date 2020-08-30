import { Text, WorldManager } from 'core/entity';
import { Data } from 'core/serialize';
import { GraphicsContext } from 'core/graphics';
import { clamp, sleep } from 'core/util';
import { Echo } from './Echo';

export class TimedText extends Text {
  public static typeName: string = 'TimedText';

  public duration: number = 0.5;
  public elapsed: number = 0;

  private isInitialized: boolean = false;

  public constructor() {
    super();
    this.type = TimedText.typeName;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.isInitialized = true;
      await sleep(1);
      this.markForDelete();
      const echo = WorldManager.spawn(Echo, this.position);
      echo.initialize(this, false, 0.5);
    }
  }
}
