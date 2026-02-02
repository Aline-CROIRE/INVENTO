import React from 'react';
import styled from 'styled-components';

const HighlightCard = styled.div`
  grid-column: span 2; background: linear-gradient(135deg, #28A745 0%, #007BFF 100%);
  border-radius: 24px; padding: 2rem; position: relative; overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
`;

const ActionButton = styled.button`
  background: white; color: var(--navy); padding: 10px 20px;
  border-radius: 12px; font-weight: bold; margin-top: 1rem;
`;

const InsightCard = ({ insight }) => (
  <HighlightCard>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
        Daily Insight
      </span>
      <h2 style={{ margin: '1rem 0' }}>{insight?.message || "All systems healthy"}</h2>
      <p style={{ opacity: 0.9 }}>{insight?.action || "No critical actions needed today."}</p>
      {insight && <ActionButton>Execute Recommendation</ActionButton>}
    </div>
  </HighlightCard>
);

export default InsightCard;