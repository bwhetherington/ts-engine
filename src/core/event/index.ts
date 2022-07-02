export * from '@/core/event/observer';

import {EventManager, StepEvent} from '@/core/event/manager';
export * from '@/core/event/util';

const EM = new EventManager();
export {StepEvent, EM as EventManager};