import React from 'react';
import styled from 'styled-components';

import {
  Debug,
  Chat,
  EventBar,
  BarStyle,
  Scoreboard,
  FormContainer,
  UpgradeContainer,
  Radar,
  Column,
  Panel,
  Row,
} from 'client/components';
import {AlertContainer} from './alert';

const UIContainer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
`;

export const App: React.FunctionComponent<{}> = () => (
  <UIContainer>
    <div className="top left">
      <Debug />
    </div>
    <div className="bottom left">
      <Row>
        <Column>
          <Chat lineLimit={100} />
          <Panel>
            <Column>
              <EventBar label="HP" barStyle={BarStyle.Life} id="life-bar" />
              <EventBar label="XP" barStyle={BarStyle.XP} id="xp-bar" />
            </Column>
          </Panel>
        </Column>
      </Row>
    </div>
    <div className="bottom right">
      <Column>
        <Radar />
      </Column>
    </div>
    <div className="top right">
      <Column>
        <Scoreboard />
      </Column>
    </div>
    <div className="bottom center-horizontal">
      <UpgradeContainer />
    </div>
    <div className="top center-horizontal">
      <AlertContainer />
    </div>
    <FormContainer />
  </UIContainer>
);
