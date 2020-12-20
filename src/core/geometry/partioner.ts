import {Bounded, Rectangle} from 'core/geometry';
import {Renderable} from 'core/graphics';

export interface Partioner<T extends Bounded> extends Bounded, Renderable {
  resize(bounds: Rectangle): void;
  insert(element: T): void;
  query(area: Rectangle): Set<T>;
  clear(): void;
}
