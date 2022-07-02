import React from 'react';
import styled from 'styled-components';

export enum TooltipPosition {
  Top,
  Bottom,
  Left,
  Right,
}

interface TooltipProps {
  position: TooltipPosition;
  content: string;
}

const TooltipText = styled.span``;

const TooltipBox = styled.div`
  visibility: hidden;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.8);
  width: 230px;
  padding: 8px 8px;
  border-radius: 4px;
`;

const TooltipCard = styled.div`
  & ${TooltipText}:hover + ${TooltipBox} {
    position: absolute;
    left: 0;
    top: 0;
    visibility: visible;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.8);
    width: 230px;
    padding: 8px 8px;
    border-radius: 4px;
  }
`;

// example:
/**
 * <Tooltip content="Foo">Inner content</Tooltip>
 */

export const Tooltip: React.FC<TooltipProps> = (props) => (
  <TooltipCard>
    <TooltipText>{props.children}</TooltipText>
    <TooltipBox>{props.content}</TooltipBox>
  </TooltipCard>
);
