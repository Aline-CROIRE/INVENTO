import React from 'react';
import styled from 'styled-components';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#f43f5e', '#00B0FF', '#885AF8', '#fbbf24', '#10b981', '#ec4899'];

export default function ExpenseCharts({ data, type }) {
  // CRITICAL: Group by Category so Pie slices are clean
  const chartData = React.useMemo(() => {
    const map = {};
    data.expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [data]);

  return (
    <Card>
      <h3>{type === 'area' ? 'Spending Trend' : 'Cost Allocation'}</h3>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={chartData}>
              <XAxis dataKey="name" hide />
              <Tooltip contentStyle={{background: '#0f172a', border: 'none', borderRadius: '10px'}} />
              <Area type="monotone" dataKey="value" stroke="#f43f5e" fill="#f43f5e20" strokeWidth={3} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie 
                data={chartData} 
                innerRadius={60} 
                outerRadius={80} 
                paddingAngle={5} 
                dataKey="value" 
                label={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
              >
                {chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{background: '#0f172a', border: 'none'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const Card = styled.div` background: #0f172a; padding: 1.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); h3 { font-size: 0.8rem; color: #64748b; text-transform: uppercase; margin: 0 0 15px; } `;