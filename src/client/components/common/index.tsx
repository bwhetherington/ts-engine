import React from 'react';
import styled from 'styled-components';

export const UI_MARGIN = '5px';

export const PanelContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.75);
  padding: ${UI_MARGIN};
  /* border-radius: 4px; */
  pointer-events: auto;
  /* font-size: 0.9em; */
  user-select: none;
  color: white;
`;

interface ColumnProps {
  margin?: number;
}

export const Column = styled.div<ColumnProps>`
  display: flex;
  flex-direction: column;
  pointer-events: inherit;
  /* pointer-events: none; */
  gap: ${(props) => props.margin ?? UI_MARGIN};
`;

export const PanelHeader = styled.div`
  text-align: center;
  padding-bottom: 4px;
  margin-left: 10px;
  margin-right: 10px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(3px);
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
  gap: ${UI_MARGIN};

  /* & > :not(:last-child) {
    margin-right: ${UI_MARGIN};
  } */
`;

export const Button = styled.button`
  border: 2px solid;
  border-color: rgba(255, 255, 255, 0.33);
  padding: 5px 10px 5px 10px;
  /* border-radius: 4px; */
  background-color: rgba(255, 255, 255, 0);
  outline: none;
  color: white;
  font-family: inherit;
  margin: 2px;
  cursor: pointer;
  /* white-space: nowrap; */

  &:disabled {
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.67);
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const BlueButton = styled(Button)`
  background-color: rgba(32, 128, 192, 0.85);

  &:disabled {
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.67);
    background-color: rgba(94, 178, 235, 0.85);
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

export const Background = styled.div`
  position: fixed;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;

  &.hidden {
    visibility: hidden;
    opacity: 0%;
    transition: visibility 0s 0.25s, opacity 0.25s ease-out;
  }

  &.visible {
    visibility: visible;
    opacity: 100%;
    transition: opacity 0.25s ease-in;
  }
`;

export * from 'client/components/common/inputs';
