import styled from 'styled-components';

export const UI_MARGIN = '5px';

export const Panel = styled.div`
  background-color: rgba(0, 0, 0, 0.75);
  padding: ${UI_MARGIN};
  border-radius: 4px;
  pointer-events: auto;
  font-size: 0.9em;
  user-select: none;
  color: white;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;

  & > :not(:last-child) {
    margin-bottom: ${UI_MARGIN};
  }
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  /* pointer-events: none; */

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
