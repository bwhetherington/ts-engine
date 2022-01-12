import React, {useState} from 'react';

import {UUID} from '@/core/uuid';
import {Upgrade, UpgradeManager, Offer, OfferUpgradeEvent} from '@/core/upgrade';
import {Iterator} from '@/core/iterator';

import {Row} from '@/client/components';
import {UpgradeComponent} from '@/client/components/upgrade';

interface OfferProps {
  offer: Offer;
  onSelect?: (id: UUID, upgrade: Upgrade) => void;
}

export const OfferComponent: React.FunctionComponent<OfferProps> = ({
  offer: {id, upgrades},
  onSelect,
}) => {
  const upgradeComponents = Iterator.array(upgrades)
    .filterMap((type) => UpgradeManager.instantiate(type))
    .enumerate()
    .map(([upgrade, key]) => (
      <UpgradeComponent
        key={key}
        id={id}
        upgrade={upgrade}
        onSelect={onSelect}
      />
    ))
    .toArray();
  return <Row>{upgradeComponents}</Row>;
};
