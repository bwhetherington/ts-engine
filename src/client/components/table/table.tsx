import React from 'react';

import {Iterator} from '@/core/iterator';
import {Data} from '@/core/serialize';

export interface ColumnInfo {
  field: string;
  label: string;
  width: string;
}

interface ColumnsProps {
  columns: ColumnInfo[];
}

interface TableProps {
  columns: ColumnInfo[];
  data: Iterable<Data>;
}

interface TableRowProps {
  columns: ColumnInfo[];
  data: Data;
}

const TableRow: React.FunctionComponent<TableRowProps> = (props) => {
  const cells = Iterator.from(props.columns)
    .map((info) => info.field)
    .map((field) => <td key={field}>{props.data[field]}</td>)
    .toArray();
  return <tr>{cells}</tr>;
};

const ColGroup: React.FunctionComponent<ColumnsProps> = (props) => {
  const cols = Iterator.from(props.columns)
    .map(({field, width}) => (
      <col key={field} style={{width, tableLayout: 'fixed'}} />
    ))
    .toArray();
  return <colgroup>{cols}</colgroup>;
};

export const DataTable: React.FunctionComponent<TableProps> = (props) => {
  const headerRow = Iterator.from(props.columns)
    .map(({field, label}) => <th key={field}>{label}</th>)
    .toArray();
  const rows = Iterator.from(props.data)
    .enumerate()
    .map(([rowData, index]) => (
      <TableRow key={index} columns={props.columns} data={rowData} />
    ))
    .toArray();
  return (
    <table>
      <ColGroup columns={props.columns} />
      <thead>
        <tr>{headerRow}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
