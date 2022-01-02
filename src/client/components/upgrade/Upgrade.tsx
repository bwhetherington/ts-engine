import React from 'react';
import styled from 'styled-components';
import {sanitize} from 'dompurify';

import {Upgrade} from 'core/upgrade';
import {UUID} from 'core/uuid';

import {Button, Panel, PanelHeader} from 'client/components';

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

export const UpgradeComponent: React.FunctionComponent<UpgradeProps> = ({
  id,
  upgrade,
  onSelect,
}) => {
  const onClick = () => onSelect?.(id, upgrade);
  const description = sanitize(upgrade.description);

  let header;
  if (upgrade.isUnique) {
    header = <PanelHeader><strong>*</strong>{upgrade.name}<strong>*</strong></PanelHeader>;
  } else {
    header = <PanelHeader>{upgrade.name}</PanelHeader>;
  }

  return (
    <Panel>
      <Container>
        {header}
        <Content dangerouslySetInnerHTML={{__html: description}} />
        <Button onClick={onClick}>Select</Button>
      </Container>
    </Panel>
  );
};
