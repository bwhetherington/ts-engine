import React from 'react';
import {ColumnInfo, Component, DataTable, Props} from 'client/components';
import {Data} from 'core/serialize';
import {TableEvent} from 'core/table';

interface EventTableProps {
  id: string;
  columns: ColumnInfo[];
}

interface EventTableState {
  data: Data[];
}

export class EventTable extends Component<EventTableProps, EventTableState> {
  public constructor(props: Props<EventTableProps>) {
    super(props, {
      data: [],
    });
  }

  public override componentDidMount(): void {
    this.streamEvents<TableEvent>('TableEvent')
      .map(({data}) => data)
      .filter(({id}) => id === this.props.id)
      .forEach(({data}) => this.setState({data}));
  }

  public override render(): JSX.Element {
    return <DataTable columns={this.props.columns} data={this.state.data} />;
  }
}
