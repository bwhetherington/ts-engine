import React from 'react';
import styled from 'styled-components';

import {Iterator} from '@/core/iterator';
import {HeroModifier, MODIFIER_KEYS} from '@/core/upgrade';

import {Column, Line} from '@/client/components';

interface ModifiersProps {
  modifiers: HeroModifier;
}

const ModifiersContent = styled.table`
  margin-left: auto;
  margin-right: auto;
`;

const ModifierLabel = styled.td`
  font-weight: bold;
  text-align: right;
`;

const ModifierValue = styled.td`
  text-align: left;
`;

enum KeyType {
  Multiplier,
  Increase,
}

interface KeyInfo {
  name: string;
  type: KeyType;
}

const KEY_INFO: Record<string, KeyInfo> = {
  life: {
    name: 'Life',
    type: KeyType.Multiplier,
  },
  lifeRegen: {
    name: 'Regen',
    type: KeyType.Multiplier,
  },
  lifeRegenDelay: {
    name: 'Regen Delay',
    type: KeyType.Multiplier,
  },
  speed: {
    name: 'Speed',
    type: KeyType.Multiplier,
  },
  friction: {
    name: 'Friction',
    type: KeyType.Multiplier,
  },
  mass: {
    name: 'Mass',
    type: KeyType.Multiplier,
  },
  armor: {
    name: 'Armor',
    type: KeyType.Increase,
  },
  damage: {
    name: 'Damage',
    type: KeyType.Multiplier,
  },
  weaponDamage: {
    name: 'Weapon',
    type: KeyType.Multiplier,
  },
  pierce: {
    name: 'Pierce',
    type: KeyType.Increase,
  },
  rate: {
    name: 'Rate',
    type: KeyType.Multiplier,
  },
  shotCount: {
    name: 'Shots',
    type: KeyType.Increase,
  },
  shotSpread: {
    name: 'Spread',
    type: KeyType.Multiplier,
  },
  shotInaccuracy: {
    name: 'Accuracy',
    type: KeyType.Multiplier,
  },
  burstCount: {
    name: 'Burst',
    type: KeyType.Increase,
  },
  projectileSpeed: {
    name: 'Bullet Speed',
    type: KeyType.Multiplier,
  },
  projectileDuration: {
    name: 'Duration',
    type: KeyType.Multiplier,
  },
  absorption: {
    name: 'Absorb',
    type: KeyType.Multiplier,
  },
  reflection: {
    name: 'Reflect',
    type: KeyType.Multiplier,
  },
  lifeSteal: {
    name: 'Siphon',
    type: KeyType.Multiplier,
  },
};

function formatSign(value: number): string {
  if (value > 0) {
    return `+${value}`;
  } else {
    return `${value}`;
  }
}

function formatValue(value: number, type: KeyType): string {
  if (type === KeyType.Multiplier) {
    return formatSign(value * 100) + '%';
  } else {
    return formatSign(value);
  }
}

export const ModifiersComponent: React.FunctionComponent<ModifiersProps> = ({
  modifiers,
}) => {
  const items = Iterator.array(MODIFIER_KEYS)
    .filter((key) => modifiers.has(key))
    .map<[string, number]>((key) => ['' + key, modifiers.get(key)])
    .map(([key, value]) => {
      const {name, type} = KEY_INFO[key];
      return (
        <tr>
          <ModifierLabel>{name}: </ModifierLabel>
          <ModifierValue>{formatValue(value, type)}</ModifierValue>
        </tr>
      );
    })
    .toArray();

  return (
    <ModifiersContent>
      <tbody>{items}</tbody>
    </ModifiersContent>
  );
};
