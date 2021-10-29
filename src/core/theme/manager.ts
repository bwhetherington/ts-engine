import {LoadingManager} from 'core/assets';
import {rgb, WHITE} from 'core/graphics';
import {Theme} from 'core/theme';

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
  }

  public setTheme(theme: string | Theme): void {
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
