export * from 'core/event/util';
export * from 'core/event/observer';

import {EventManager, StepEvent} from 'core/event/manager';

const EM = new EventManager();
export {StepEvent, EM as EventManager};
