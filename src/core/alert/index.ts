export interface AlertEvent {
  message: string;
}

import {AlertManager as AM} from 'core/alert/manager';
export const AlertManager = new AM();
