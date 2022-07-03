import React from 'react';
import styled from 'styled-components';

import {KillEvent} from '@/core/entity';
import {Key, KeyAction, KeyEvent} from '@/core/input';
import {NetworkManager} from '@/core/net';
import {PlayerManager} from '@/core/player';
import {
  ChangeStoredUpgradeCountEvent,
  Offer,
  OfferUpgradeEvent,
  RequestUpgradeEvent,
  SelectUpgradeEvent,
  Upgrade,
} from '@/core/upgrade';
import {Empty} from '@/core/util';
import {UUID} from '@/core/uuid';

import {Background, Component} from '@/client/components';
import {OfferComponent} from '@/client/components/upgrade/Offer';

import {BlueButton} from '../common';

export * from '@/client/components/upgrade/Upgrade';

interface ContainerState {
  offers: Offer[];
  storedUpgrades: number;
}

export class UpgradeContainer extends Component<Empty, ContainerState> {
  constructor(props: Empty) {
    super(props, {
      offers: [],
      storedUpgrades: 0,
    });
  }

  public componentDidMount() {
    this.streamEvents(ChangeStoredUpgradeCountEvent).forEach(
      ({data: {storedUpgrades}}) => {
        this.updateState({
          storedUpgrades,
        });
      }
    );

    this.streamEvents(OfferUpgradeEvent)
      .map<Offer>(({data: {id, upgrades}}) => ({id, upgrades}))
      .forEach((offer) => {
        this.addOffer(offer);
      });

    // Remove all offers when player's hero is killed
    this.streamEvents(KillEvent)
      .filter(
        (event) =>
          event.data.targetID === PlayerManager.getActivePlayer()?.hero?.id
      )
      .forEach(() => {
        this.removeOffers();
      });

    // Open the upgrade menu when pressing space
    this.streamEvents(KeyEvent)
      .filter(
        ({data}) => data.key === Key.Space && data.action === KeyAction.KeyDown
      )
      .filter(() => this.state.storedUpgrades > 0)
      .forEach(() => {
        this.requestOffer();
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
      storedUpgrades: 0,
    });
  }

  private async removeTopOffer(): Promise<void> {
    const {offers} = this.state;
    const willBeEmpty = offers.length === 1;
    await this.updateState({
      offers: offers.slice(0, offers.length - 1),
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

  private requestOffer() {
    if (this.state.offers.length > 0) {
      return;
    }
    const hero = PlayerManager.getActivePlayer()?.hero;
    if (hero) {
      NetworkManager.sendTypedEvent(RequestUpgradeEvent, {
        hero: hero.id,
      });
    }
  }

  private get storedUpgrades(): number {
    return this.state.storedUpgrades;
  }

  public render(): JSX.Element {
    const offer = this.getTopOffer();
    const onSelect = async (id: UUID, upgrade: Upgrade) => {
      const hero = PlayerManager.getActivePlayer()?.hero;
      if (!hero) {
        return;
      }
      NetworkManager.sendTypedEvent(SelectUpgradeEvent, {
        id,
        hero: hero.id,
        upgrade: upgrade.type,
      });
      await this.removeTopOffer();
    };
    if (offer) {
      const container = (
        <Background className="visible">
          <OfferComponent offer={offer} onSelect={onSelect} />
        </Background>
      );
      return container;
    } else {
      const numOffers = this.storedUpgrades;
      if (numOffers > 0) {
        const buttonText =
          numOffers > 1
            ? `Upgrades Available (${numOffers})`
            : 'Upgrade Available';
        return (
          <BlueButton onClick={this.requestOffer.bind(this)}>
            <strong>[Space]</strong> {buttonText}
          </BlueButton>
        );
      } else {
        return <Background className="hidden" />;
      }
    }
  }
}
