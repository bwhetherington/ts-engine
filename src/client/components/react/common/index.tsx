import React from 'react';
import styled from 'styled-components';

export const UI_MARGIN = '5px';

export const PanelContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.75);
  padding: ${UI_MARGIN};
  border-radius: 4px;
  pointer-events: auto;
  font-size: 0.9em;
  user-select: none;
  color: white;
`;

interface ColumnProps {
  margin?: number;
}

export const Column = styled.div<ColumnProps>`
  display: flex;
  flex-direction: column;

  & > :not(:last-child) {
    margin-bottom: ${(props) => props.margin ?? UI_MARGIN};
  }
`;

export const PanelHeader = styled.div`
  text-align: center;
  padding-bottom: 4px;
  margin-left: 10px;
  margin-right: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
`;

export enum PanelDirection {
  Vertical,
  Horizontal,
}

interface PanelProps {
  direction?: PanelDirection;
}

export const Panel: React.FunctionComponent<PanelProps> = (props) => {
  const InnerContainer =
    props.direction === PanelDirection.Horizontal ? Row : Column;
  return (
    <PanelContainer>
      <InnerContainer>{props.children}</InnerContainer>
    </PanelContainer>
  );
};

export const Row = styled.div`
  display: flex;
  flex-direction: row;

  & > :not(:last-child) {
    margin-right: ${UI_MARGIN};
  }
`;

export const Button = styled.button`
  border: 1px solid;
  border-color: rgba(255, 255, 255, 0.33);
  padding: 5px 10px 5px 10px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0);
  outline: none;
  color: white;
  font-family: inherit;
  margin: 2px;
  cursor: pointer;

  &:disabled {
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.67);
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const CloseButton = styled.div`
  width: 28px;
  height: 28px;
  opacity: 0.33;
  display: flex;

  &:hover {
    opacity: 1;
  }

  &:before,
  &:after {
    content: ' ';
    height: 26px;
    width: 2px;
    background: white;
    color: white;
  }

  &:before {
    transform: translateX(2px) translateY(-5px) rotate(45deg);
  }

  &:after {
    transform: translateX(0px) translateY(-5px) rotate(-45deg);
  }
`;

export const FlexPadding = styled.div`
  flex-grow: 1;
`;

export * from 'client/components/react/common/inputs';
