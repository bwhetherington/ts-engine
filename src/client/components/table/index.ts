import { Component, removeChildren } from 'client/components/util';
import template from 'client/components/table/template.html';
import { EventManager } from 'core/event';
import { UUID } from 'core/uuid';
import { Data } from 'core/serialize';

interface TableEntry {
  field: string;
  value: any;
}

type TableRow = TableEntry[];

interface TableEntries {
  labels: TableRow;
  rows: Iterable<Data & { id: UUID }>;
}

interface RowData {
  tr: HTMLElement;
  tds: Record<string, HTMLElement>;
  source: Data;
}

type TableData = Record<UUID, RowData>;

export interface TableUpdateEvent {
  id: string;
  data: Partial<TableEntries>;
}

export interface TableRemoveRowEvent {
  id: string;
  row: UUID;
}

function compare(a: any, b: any): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return b - a;
  } else {
    return ('' + a).localeCompare('' + b);
  }
}

export class TableComponent extends Component {
  public static componentName: string = 'table-component';

  private titleLabel?: HTMLElement;
  private head?: HTMLElement;
  private body?: HTMLElement;

  private data?: TableData;
  private fields: string[] = [];
  private sortField: string = 'level';

  private shouldSort: boolean = false;

  public constructor() {
    super(template);

    this.titleLabel = this.queryChild('#title');
    this.head = this.queryChild('#head');
    this.body = this.queryChild('#body');

    EventManager.addListener<TableRemoveRowEvent>('TableRemoveRowEvent', (event) => {
      const { id, row } = event.data;
      if (id === this.id) {
        this.removeRow(row);
      }
    });

    EventManager.addListener<TableUpdateEvent>('TableUpdateEvent', (event) => {
      const { id, data } = event.data;
      if (id === this.id) {
        const { labels, rows } = data;
        if (labels) {
          if (this.fields.length === 0) {
            this.initialize(labels);
          }
        }
        if (rows) {
          for (const item of rows) {
            const { id } = item;
            let row = this.getRow(id);
            if (row === undefined) {
              row = this.createRow(id, item);
              if (this.data) {
                this.data[id] = row;
              }
              this.body?.appendChild(row.tr);
              this.shouldSort = true;
            }
            row.source = item;

            const realRow = row as RowData;
            for (const field of this.fields) {
              if (item.hasOwnProperty(field)) {
                const td = realRow.tds[field];
                if (td.innerText !== '' + item[field]) {
                  td.innerText = '' + item[field];
                  this.shouldSort = true;
                }
              }
            }
          }
        }
        this.trySort();
      }
    });
  }

  private initialize(labels: TableRow): void {
    // Remove any existing labels tr
    if (this.head) {
      removeChildren(this.head);
    }
    if (this.body) {
      removeChildren(this.body);
    }

    this.fields = [];

    const tr = document.createElement('tr');
    for (const { field, value } of labels) {
      this.fields.push(field);
      const td = document.createElement('td');
      td.innerText = value;
      tr.appendChild(td);
    }

    this.data = {};

    this.head?.appendChild(tr);
  }

  private trySort(): void {
    if (this.shouldSort && this.fields.includes('level')) {
      this.sort(this.sortField);
      this.shouldSort = false;
    }
  }

  private sort(field: string): void {
    if (this.body) {
      Array.from(this.body.children)
        .sort((a, b) => {
          if (this.data) {
            const { id: idA } = a;
            const { id: idB } = b;
            const dataA = this.data[idA]?.source;
            const dataB = this.data[idB]?.source;

            if (dataA && dataB) {
              return compare(dataA[field], dataB[field]);
            }
          }
          return 0;
        })
        .forEach((element) => this.body?.appendChild(element));
    }
  }

  private removeRow(rowID: UUID): void {
    const row = this.getRow(rowID);
    if (row) {
      row.tr.parentElement?.removeChild(row.tr);
      if (this.data) {
        delete this.data[rowID];
      }
    }
  }

  private createRow(id: UUID, row: Data): RowData {
    const tr = document.createElement('tr');
    tr.id = id;
    const tds: Record<string, HTMLElement> = {};

    for (const field of this.fields) {
      const value = row[field];
      const td = document.createElement('td');
      td.innerText = value;
      tr.appendChild(td);
      tds[field] = td;
    }

    return { tr, tds, source: row };
  }

  private hasRow(row: UUID): boolean {
    return this.data?.rows?.hasOwnProperty(row) ?? false;
  }

  private getRow(row: UUID): RowData | undefined {
    return this.data ? this.data[row] : undefined;
  }
}
