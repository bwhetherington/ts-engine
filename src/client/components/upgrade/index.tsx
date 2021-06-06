import React from 'react';
import styled from 'styled-components';

import {Upgrade, OfferUpgradeEvent, SelectUpgradeEvent} from 'core/upgrade';
import {UUID} from 'core/uuid';

import {Background, Button, Component, Panel} from 'client/components';
export * from 'client/components/upgrade/Upgrade';

import {OfferComponent} from 'client/components/upgrade/Offer';
import {NetworkManager} from 'core/net';
import { BlueButton } from '../common';

export interface Offer {
  id: UUID;
  upgrades: string[];
}

interface ContainerState {
  offers: Offer[];
  shouldShow: boolean;
}

export class UpgradeContainer extends Component<{}, ContainerState> {
  constructor(props: {}) {
    super(props, {
      offers: [],
      shouldShow: false,
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
    const willBeEmpty = offers.length === 1;
    await this.updateState({
      offers: offers.slice(0, offers.length - 1),
      shouldShow: !willBeEmpty,
    });
    if (willBeEmpty) {
      // Return focus to main screen
      document.getElementById('game')?.focus();
    }
  }

  private getTopOffer(): Offer | undefined {
    const {offers} = this.state;
    return offers[offers.length - 1];
  }

  private async toggleSelection(): Promise<void> {
    await this.updateState({
      shouldShow: !this.state.shouldShow,
    });
    console.log(this.state);
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
      const {shouldShow} = this.state;
      const className = shouldShow ? 'visible' : 'hidden';
      const container = (
        <Background className={className}>
          <OfferComponent offer={offer} onSelect={onSelect} />
        </Background>
      );
      if (shouldShow) {
        return container;
      } else {
        const numOffers = this.state.offers.length;
        const buttonText = numOffers > 1 ? `Upgrades available (${numOffers})` : 'Upgrade available';
        return (
          <div>
            <BlueButton onClick={this.toggleSelection.bind(this)}>{buttonText}</BlueButton>
            {container}
          </div>
        );
      }
    } else {
      return <Background className="hidden" />;
    }
  }
}
