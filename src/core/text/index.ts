import {Color} from '@/core/graphics';
import {UUID} from '@/core/uuid';

export interface TextUpdateEvent {
  id: UUID;
  isStatic?: boolean;
  color?: Color;
  tag?: string;
  text?: string;
  x?: number;
  y?: number;
}

export interface TextRemoveEvent {
  id: UUID;
}
