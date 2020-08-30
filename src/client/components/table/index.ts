import { Component } from 'client/components/util';
import template from 'client/components/debug/template.html';
import { EventManager } from 'core/event';
import { UUID } from 'core/uuid';

export type Labels<T> = {
  [key in keyof T]: string;
}

export interface TableUpdateEvent {
  id: string;
  labels: object;
  data: Record<UUID, object>;
}

export class TableComponent<T> extends Component {
  public static componentName: string = 'table-component';

  private titleLabel?: HTMLElement;
  private head?: HTMLElement;
  private body?: HTMLElement;

  constructor() {
    super(template);

    this.titleLabel = this.queryChild('#title');
    this.head = this.queryChild('#head');
    this.body = this.queryChild('#body');

    EventManager.addListener<TableUpdateEvent>('TableUpdateEvent', (event) => {
      const { labels, data } = event.data;
    });
  }
}
