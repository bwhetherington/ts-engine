import React from 'react';
import styled from 'styled-components';

import {
  Upgrade,
  OfferUpgradeEvent,
  Offer,
  SelectUpgradeEvent,
} from 'core/upgrade';
import {UUID} from 'core/uuid';
import {NetworkManager} from 'core/net';

import {Background, Button, Component, Panel} from 'client/components';
export * from 'client/components/upgrade/Upgrade';

import {OfferComponent} from 'client/components/upgrade/Offer';
import {BlueButton} from '../common';
import {PlayerManager} from 'core/player';
import {KillEvent} from 'core/entity';
import {Key, KeyAction, KeyEvent} from 'core/input';

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

    // Remove all offers when player's hero is killed
    this.streamEvents<KillEvent>('KillEvent')
      .use(console.log)
      .filter(
        (event) =>
          event.data.targetID === PlayerManager.getActivePlayer()?.hero?.id
      )
      .forEach(() => {
        this.removeOffers();
      });

    // Open the upgrade menu when pressing space
    this.streamEvents<KeyEvent>('KeyEvent')
      .filter(
        ({data}) => data.key === Key.Space && data.action === KeyAction.KeyDown
      )
      .filter(() => this.state.offers.length > 0)
      .forEach(() => {
        this.toggleSelection();
      });
  }

  private async addOffer(offer: Offer): Promise<void> {
    await this.updateState({
      offers: [offer, ...this.state.offers],
    });
  }

  private async removeOffers(): Promise<void> {
    await this.updateState({
      offers: [],
      shouldShow: false,
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
    const shouldToggle = this.state.offers.length > 0;
    if (shouldToggle) {
      await this.updateState({
        shouldShow: !this.state.shouldShow,
      });
    }
  }

  public render(): JSX.Element {
    const offer = this.getTopOffer();
    const onSelect = async (id: UUID, upgrade: Upgrade) => {
      const hero = PlayerManager.getActivePlayer()?.hero?.id;
      if (!hero) {
        return;
      }
      NetworkManager.sendEvent<SelectUpgradeEvent>({
        type: 'SelectUpgradeEvent',
        data: {
          id,
          hero,
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
        const buttonText =
          numOffers > 1
            ? `Upgrades Available (${numOffers})`
            : 'Upgrade Available';
        return (
          <div>
            <BlueButton onClick={this.toggleSelection.bind(this)}>
              <strong>[Space]</strong> {buttonText}
            </BlueButton>
            {container}
          </div>
        );
      }
    } else {
      return <Background className="hidden" />;
    }
  }
}
