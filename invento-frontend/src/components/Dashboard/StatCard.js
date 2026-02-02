import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 1.5rem; backdrop-filter: blur(5px);
`;

const Label = styled.p` color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0; `;
const Value = styled.h2` font-size: 1.8rem; margin: 0.5rem 0; color: white; `;
const Trend = styled.span` color: ${props => props.up ? '#28A745' : '#FF8C42'}; font-size: 0.8rem; `;

const StatCard = ({ label, value, trend, isUp }) => (
  <Card>
    <Label>{label}</Label>
    <Value>{value}</Value>
    <Trend up={isUp}>{trend}</Trend>
  </Card>
);

export default StatCard;