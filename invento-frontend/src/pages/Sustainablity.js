import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Package } from 'lucide-react';
import api from '../api/axios';

const Sustainability = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/sales/report').then(res => setReport(res.data));
  }, []);

  const profitData = [
    { name: 'Revenue', val: report?.totalRevenue || 0, color: '#007BFF' },
    { name: 'Stock Cost', val: report?.totalRevenue - (report?.grossProfit || 0), color: '#888' },
    { name: 'Waste Loss', val: report?.totalWasteLoss || 0, color: '#FF8C42' },
    { name: 'Real Profit', val: report?.netProfit || 0, color: '#28A745' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Financial Truth & Waste Tracking</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2.5rem' }}>
        <StatCard>
          <TrendingUp color="#28A745" />
          <div><small>Net Real Profit</small><h3>{(report?.netProfit || 0).toLocaleString()} RWF</h3></div>
        </StatCard>
        <StatCard>
          <AlertTriangle color="#FF8C42" />
          <div><small>Inventory Loss (Waste)</small><h3>{(report?.totalWasteLoss || 0).toLocaleString()} RWF</h3></div>
        </StatCard>
        <StatCard>
          <Package color="#007BFF" />
          <div><small>Active Stock Value</small><h3>Calculated via Batches</h3></div>
        </StatCard>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '30px', marginTop: '3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3>Real Profit Waterfall (Revenue vs Expenses)</h3>
        <div style={{ height: '350px', marginTop: '2rem' }}>
          <ResponsiveContainer>
            <BarChart data={profitData}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#0D1F2D', border: 'none'}} />
              <Bar dataKey="val">
                {profitData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = styled.div` background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 24px; display: flex; align-items: center; gap: 1.5rem; h3 { margin: 5px 0; font-size: 1.5rem; } small { opacity: 0.5; } `;

export default Sustainability;