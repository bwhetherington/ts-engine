import React from 'react';
import styled from 'styled-components';
import {sanitize} from 'dompurify';

import {ClassUpgrade, Upgrade} from 'core/upgrade';
import {UUID} from 'core/uuid';

import {Button, Column, Panel, PanelHeader} from 'client/components';
import {BlueButton, Minor} from '../common';
import {JsxEmit} from 'typescript';

interface UpgradeProps {
  id: UUID;
  upgrade: Upgrade;
  onSelect?: (id: UUID, upgrade: Upgrade) => void;
}

const Container = styled.div`
  width: 180px;
  height: 240px;
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
