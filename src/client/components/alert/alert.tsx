import React from 'react';
import styled from 'styled-components';

interface Props {
  message: string;
}

const AlertBox = styled.div`
  font-size: 1.25em;
  padding: 5px;
  border: 1px solid;
  padding: 5px 10px 5px 10px;
  border-radius: 4px;
  backdrop-filter: blur(10px);
  outline: none;
  color: white;
  font-family: inherit;
  margin: 2px;
  background-color: rgba(32, 128, 192, 0.85);
  border-color: rgba(255, 255, 255, 0.67);
  text-align: center;
`;

export const AlertComponent: React.FunctionComponent<Props> = ({message}) => (
  <AlertBox>{message}</AlertBox>
);
