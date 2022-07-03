import {sanitize} from 'dompurify';
import React from 'react';
import styled from 'styled-components';

import {ClassUpgrade, ModifierUpgrade, Upgrade} from '@/core/upgrade';
import {UUID} from '@/core/uuid';

import {
  BlueButton,
  Button,
  Column,
  Minor,
  Panel,
  PanelHeader,
} from '@/client/components';
import {ModifiersComponent} from '@/client/components/upgrade/Modifiers';

interface UpgradeProps {
  id: UUID;
  upgrade: Upgrade;
  onSelect?: (id: UUID, upgrade: Upgrade) => void;
}

const Container = styled.div`
  width: 220px;
  height: 320px;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  padding: 5px;
  flex-grow: 1;
`;

function getUpgradeCategory(upgrade: Upgrade): JSX.Element {
  if (upgrade instanceof ClassUpgrade) {
    return <>* Class *</>;
  } else if (!upgrade.isRepeatable) {
    return <>* Unique *</>;
  }
  return <>Normal</>;
}

export const UpgradeComponent: React.FunctionComponent<UpgradeProps> = ({
  id,
  upgrade,
  onSelect,
}) => {
  const onClick = () => onSelect?.(id, upgrade);
  const description = sanitize(upgrade.description);

  const header = (
    <PanelHeader>
      <b>{upgrade.name}</b>
    </PanelHeader>
  );
  const subheader = (
    <PanelHeader>
      <Minor>{getUpgradeCategory(upgrade)}</Minor>
    </PanelHeader>
  );

  const SelectButton = upgrade instanceof ClassUpgrade ? BlueButton : Button;

  if (upgrade instanceof ModifierUpgrade) {
    return (
      <Panel>
        <Container>
          <Column>
            {header}
            {subheader}
          </Column>
          <Content>
            {description}
            <ModifiersComponent modifiers={upgrade.modifiers} />
          </Content>
          <SelectButton onClick={onClick}>Select</SelectButton>
        </Container>
      </Panel>
    );
  }

  return (
    <Panel>
      <Container>
        <Column>
          {header}
          {subheader}
        </Column>
        <Content dangerouslySetInnerHTML={{__html: description}} />
        <SelectButton onClick={onClick}>Select</SelectButton>
      </Container>
    </Panel>
  );
};
