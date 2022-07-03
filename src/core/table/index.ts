import {Data} from '@/core/serialize';
import {makeEventType} from '../event';

export interface TableEvent {
  id: string;
  data: Data[];
}
export const TableEvent = makeEventType<TableEvent>('TableEvent');
