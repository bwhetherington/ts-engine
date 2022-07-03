export * from '@/core/theme/theme';
import {ThemeManager as TM} from '@/core/theme/manager';
import {makeEventType} from '@/core/event';

export interface SetThemeEvent {
  theme: string;
}
export const SetThemeEvent = makeEventType<SetThemeEvent>('SetThemeEvent');

export const ThemeManager = new TM();
