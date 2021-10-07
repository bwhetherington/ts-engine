import {Color, hex} from 'core/graphics';
import {
  Alignment,
  Column,
  functionalWidget,
  LabeledProgressBar,
  StatefulWidget,
  Widget,
} from 'core/ui';
import {BarUpdateEvent} from 'core/util';

interface EventBarProps {
  id: string;
  color?: Color;
  backgroundColor?: Color;
}

interface EventBarState {
  value: number;
  maxValue: number;
}

const BLUE_FG = hex('249fde');
const BLUE_BG = hex('242234');

class EventBar extends StatefulWidget<EventBarProps, EventBarState> {
  protected state = {
    value: 1,
    maxValue: 1,
  };

  public onMount(): void {
    this.observer
      .streamEvents<BarUpdateEvent>('BarUpdateEvent')
      .map(({data}) => data)
      .filter(({id}) => id === this.props.id)
      .forEach(({value, maxValue}) => {
        this.updateState({
          value,
          maxValue,
        });
      });
  }

  public renderTemplate(): Widget<any> {
    return new LabeledProgressBar({
      current: this.state.value,
      maximum: this.state.maxValue,
      color: this.props.color,
      backgroundColor: this.props.backgroundColor,
    });
  }
}

export const StatusWidget = functionalWidget(
  () =>
    new Column({
      spacing: 1,
      alignment: Alignment.End,
      children: [
        new EventBar({
          id: 'life-bar',
        }),
        new EventBar({
          id: 'xp-bar',
          color: BLUE_FG,
          backgroundColor: BLUE_BG,
        }),
      ],
    })
);
