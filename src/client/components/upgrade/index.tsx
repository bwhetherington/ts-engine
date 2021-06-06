import React from 'react';

import {
  Upgrade,
  UpgradeManager,
  OfferUpgradeEvent,
  SelectUpgradeEvent,
} from 'core/upgrade';
import {UUID} from 'core/uuid';

import {Background, Component} from 'client/components';
export * from 'client/components/upgrade/Upgrade';

import {OfferComponent} from 'client/components/upgrade/Offer';
import {NetworkManager} from 'core/net';

export interface Offer {
  id: UUID;
  upgrades: string[];
}

interface ContainerState {
  offers: Offer[];
}

export class UpgradeContainer extends Component<{}, ContainerState> {
  constructor(props: {}) {
    super(props, {
      offers: [],
    });
  }

  public componentDidMount(): void {
    this.streamEvents<OfferUpgradeEvent>('OfferUpgradeEvent')
      .map<Offer>(({data: {id, upgrades}}) => ({id, upgrades}))
      .forEach((offer) => {
        this.addOffer(offer);
      });
  }

  private async addOffer(offer: Offer): Promise<void> {
    await this.updateState({
      offers: [offer, ...this.state.offers],
    });
  }

  private async removeTopOffer(): Promise<void> {
    const {offers} = this.state;
    await this.updateState({
      offers: offers.slice(0, offers.length - 1),
    });
    if (this.state.offers.length === 0) {
      // Return focus to main screen
      document.getElementById('game')?.focus();
    }
  }

  private getTopOffer(): Offer | undefined {
    const {offers} = this.state;
    return offers[offers.length - 1];
  }

  public render(): JSX.Element {
    const offer = this.getTopOffer();
    const onSelect = async (id: UUID, upgrade: Upgrade) => {
      NetworkManager.sendEvent<SelectUpgradeEvent>({
        type: 'SelectUpgradeEvent',
        data: {
          id,
          upgrade: upgrade.type,
        },
      });
      await this.removeTopOffer();
    };
    if (offer) {
      return (
        <Background className="visible">
          <OfferComponent offer={offer} onSelect={onSelect} />
        </Background>
      );
    } else {
      return <Background className="hidden" />;
    }
  }
}
