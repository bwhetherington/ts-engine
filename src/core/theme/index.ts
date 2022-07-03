import {makeEventType} from '@/core/event';
import {ThemeManager as TM} from '@/core/theme/manager';

export * from '@/core/theme/theme';

export interface SetThemeEvent {
  theme: string;
}
export const SetThemeEvent = makeEventType<SetThemeEvent>('SetThemeEvent');

export const ThemeManager = new TM();
