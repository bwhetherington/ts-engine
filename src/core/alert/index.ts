import {makeEventType} from '@/core/event';

export interface AlertEvent {
  message: string;
}
export const AlertEvent = makeEventType<AlertEvent>('AlertEvent');

import {AlertManager as AM} from '@/core/alert/manager';
export const AlertManager = new AM();
