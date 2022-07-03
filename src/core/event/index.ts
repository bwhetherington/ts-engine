import {EventManager, StepEvent} from '@/core/event/manager';

export * from '@/core/event/util';

export * from '@/core/event/observer';

const EM = new EventManager();
export {StepEvent, EM as EventManager};
