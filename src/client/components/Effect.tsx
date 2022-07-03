import React from 'react';
import styled from 'styled-components';

import {Column} from '@/client/components';

const boonColor = 'rgba(32, 128, 192, 0.85)';
const conditionColor = 'rgba(192, 32, 32, 0.85)';

interface EffectBoxProps {
  isBoon: boolean;
}

const EffectBox = styled.div<EffectBoxProps>`
  width: 30px;
  height: 30px;
  text-align: center;
  background: ${(props) => (props.isBoon ? boonColor : conditionColor)};
  color: white;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-color: rgba(255, 255, 255, 0.67);
`;

const EffectStackLabel = styled.span`
  padding: 2px;
  padding-left: 4px;
  padding-right: 4px;
  text-align: center;
  background: rgba(0, 0, 0, 0.75);
  color: white;
`;

export interface EffectProps {
  name: string;
  stacks: number;
  isBoon: boolean;
}

function abbreviateName(name: string, places = 2): string {
  return name.slice(0, places);
}

export const EffectComponent: React.FC<EffectProps> = (props) => {
  const name = abbreviateName(props.name, 2);
  return (
    <>
      <Column>
        <EffectBox isBoon={props.isBoon}>{name}</EffectBox>
        <EffectStackLabel>{props.stacks}</EffectStackLabel>
      </Column>
    </>
  );
};
