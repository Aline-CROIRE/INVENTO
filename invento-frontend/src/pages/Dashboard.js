import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import StatCard from '../components/Dashboard/StatCard';
import InsightCard from '../components/Dashboard/InsightCard';

const DashboardWrapper = styled.div`
  max-width: 1200px; margin: 0 auto;
`;

const HeaderSection = styled.div`
  margin-bottom: 2.5rem;
  h4 { color: #28A745; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  h1 { font-size: 2.5rem; margin: 8px 0; font-weight: 800; }
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;
  margin-top: 2rem;
`;

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/insights/dashboard');
        setData(res.data);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  return (
    <DashboardWrapper>
      <HeaderSection>
        <h4>System Overview</h4>
        <h1>Shop Intelligence</h1>
      </HeaderSection>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <InsightCard insight={data?.insights[0]} />
        <StatCard 
          label="Shop Health Score" 
          value={`${data?.healthScore || 100}%`} 
          trend="Based on stock levels" 
          isUp={data?.healthScore > 80} 
        />
      </div>

      <StatsGrid>
        <StatCard 
          label="Monthly Profit" 
          value={`$${data?.metrics?.currentMonthProfit || 0}`} 
          trend={`${data?.metrics?.profitGrowth || 0}% vs last month`} 
          isUp={data?.metrics?.profitGrowth >= 0} 
        />
        <StatCard 
          label="CO2 Impact Avoided" 
          value={`${data?.metrics?.co2ImpactKg || 0}kg`} 
          trend="Sustainability Rating" 
          isUp={true} 
        />
        <StatCard 
          label="Pending Expiries" 
          value="4 Items" 
          trend="Action Required" 
          isUp={false} 
        />
      </StatsGrid>
    </DashboardWrapper>
  );
};

export default Dashboard;