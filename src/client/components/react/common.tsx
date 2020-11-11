import styled from 'styled-components';

export const UI_MARGIN = '5px';

export const Panel = styled.div`
  background-color: rgba(0, 0, 0, 0.67);
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

export * from 'client/components/react/inputs';
