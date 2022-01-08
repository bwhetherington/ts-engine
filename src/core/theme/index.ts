export * from 'core/theme/theme';
import {ThemeManager as TM} from 'core/theme/manager';

export interface SetThemeEvent {
  theme: string;
}

export const ThemeManager = new TM();
