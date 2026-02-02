import React from 'react';
import styled, { keyframes } from 'styled-components';

const move = keyframes`
  from { transform: translateY(0) rotate(0deg); opacity: 1; }
  to { transform: translateY(-1000px) rotate(720deg); opacity: 0; }
`;

const Container = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: -1; overflow: hidden; background: #0D1F2D;
`;

const Particle = styled.div`
  position: absolute; bottom: -150px; width: 20px; height: 20px;
  background: rgba(255, 255, 255, 0.05); border-radius: 50%;
  animation: ${move} 25s linear infinite;
`;

const BackgroundParticles = () => (
  <Container>
    {[...Array(15)].map((_, i) => (
      <Particle key={i} style={{
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 50 + 10}px`,
        height: `${Math.random() * 50 + 10}px`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${Math.random() * 10 + 15}s`
      }} />
    ))}
  </Container>
);

export default BackgroundParticles;