import React from 'react';
import styled from 'styled-components';
import { Wallet, TrendingUp, Hash, Clock } from 'lucide-react';

export default function ExpenseStats({ data }) {
  const unpaid = data.expenses.filter(e => e.status === 'PENDING').length;
  
  const cards = [
    { label: "Total Money Spent", val: `Rwf ${data.totalAmount.toLocaleString()}`, icon: <Wallet />, color: "#f43f5e" },
    { label: "Average Transaction", val: `Rwf ${Math.floor(data.totalAmount / (data.expenses.length || 1)).toLocaleString()}`, icon: <TrendingUp />, color: "#00B0FF" },
    { label: "Total Records", val: data.expenses.length, icon: <Hash />, color: "#885AF8" },
    { label: "Unpaid Bills", val: unpaid, icon: <Clock />, color: "#fbbf24" }
  ];

  return (
    <StatsGrid>
      {cards.map((c, i) => (
        <StatCard key={i} $color={c.color}>
          <div className="icon-wrap">{c.icon}</div>
          <div className="info">
            <label>{c.label}</label>
            <h3>{c.val}</h3>
          </div>
        </StatCard>
      ))}
    </StatsGrid>
  );
}

const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; `;
const StatCard = styled.div` background: #0f172a; padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 15px;
  .icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: ${p => p.$color}15; color: ${p => p.$color}; display: flex; align-items: center; justify-content: center; }
  .info { label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; } h3 { margin: 2px 0 0; font-size: 1.2rem; font-weight: 900; } } `;