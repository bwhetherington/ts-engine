import {AlertManager as AM} from '@/core/alert/manager';
import {makeEventType} from '@/core/event';

export interface AlertEvent {
  message: string;
}
export const AlertEvent = makeEventType<AlertEvent>('AlertEvent');

export const AlertManager = new AM();
