import React from 'react';
import {EffectComponent, Props, Row} from '@/client/components';
import {Iterator} from '@/core/iterator';
import {Component} from './Component';
import {Empty} from '@/core/util';
import {EffectManager, UpdateEffectCountEvent} from '@/core/effect';
import {PlayerManager} from '@/core/player';

interface EffectsContainerState {
  effectCounts: [string, number][];
}

export class EffectsContainer extends Component<Empty, EffectsContainerState> {
  constructor(props: Props<Empty>) {
    super(props, {
      effectCounts: [],
    });
  }

  public override componentDidMount() {
    this.streamEvents<UpdateEffectCountEvent>('UpdateEffectCountEvent')
      // Validate that we are only updating this for the active player's hero
      .filter((event) => {
        const heroId = PlayerManager.getActivePlayer()?.hero?.id;
        return event.data.targetID === heroId;
      })
      .forEach((event) => {
        const effectsList = Iterator.entries(event.data.effectCounts)
          .toArray()
          .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
        const topFive = Iterator.array(effectsList)
          .filter(([_name, count]) => count > 0)
          .take(5)
          .toArray();
        this.updateState({
          effectCounts: topFive,
        });
      });
  }

  public override render(): JSX.Element {
    const topFive = Iterator.array(this.state.effectCounts)
      .map(([name, count]) => {
        const isBoon = EffectManager.getInfo(name)?.isBoon ?? false;
        return (
          <EffectComponent
            name={name}
            key={name}
            isBoon={isBoon}
            stacks={count}
          />
        );
      })
      .toArray();
    return <Row>{topFive}</Row>;
  }
}
