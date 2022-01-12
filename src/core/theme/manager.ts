import {LoadingManager} from '@/core/assets';
import {EventManager} from '@/core/event';
import {rgb, WHITE} from '@/core/graphics';
import {NetworkManager} from '@/core/net';
import {SetThemeEvent, Theme} from '@/core/theme';

const DEFAULT_THEME = Theme.create({
  type: 'DefaultTheme',
  isDarkMode: false,
  foregroundColor: rgb(0.85, 0.85, 0.85),
  backgroundColor: rgb(1, 1, 1),
});

export class ThemeManager extends LoadingManager<Theme> {
  public current: Theme = DEFAULT_THEME;

  constructor() {
    super('ThemeManager');
  }

  public async initialize(): Promise<void> {
    this.registerAssetType(Theme);
    await this.loadAssetTemplates('templates/themes');

    if (NetworkManager.isClient()) {
      EventManager.streamEvents<SetThemeEvent>('SetThemeEvent').forEach(
        (event) => this.setTheme(event.data.theme)
      );
    }
  }

  public setTheme(theme: string | Theme) {
    if (typeof theme === 'string') {
      const loaded = this.instantiate(theme);
      if (loaded) {
        this.current = loaded;
      }
    } else {
      this.current = theme;
    }
  }
}
