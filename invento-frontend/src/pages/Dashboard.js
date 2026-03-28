import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Activity, RefreshCcw, 
  ChevronRight, Radio, ArrowUpRight, Receipt, AlertTriangle,
  Calendar, Filter
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Line, ComposedChart 
} from 'recharts';

// --- HELPER: Number Shortener (e.g., 1.2M, 50k) ---
const formatShort = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    const sign = num < 0 ? "-" : "";
    const absNum = Math.abs(num);
    
    if (absNum >= 1000000) {
        return sign + (absNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (absNum >= 1000) {
        return sign + (absNum / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return sign + absNum.toString();
};

const Dashboard = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [viewScope, setViewScope] = useState('MONTH'); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realData, setRealData] = useState(null);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  }, []);

  const data = useMemo(() => {
    if (isAnalysisMode) {
        return { 
            health: 92, 
            stats: [
                { label: "Sales Revenue", val: formatShort(2400000), color: "#00B0FF", icon: <DollarSign/> },
                { label: "Net Earnings", val: formatShort(840000), color: "#00E676", icon: <TrendingUp/> },
                { label: "Op. Costs", val: formatShort(310000), color: "#f43f5e", icon: <Receipt/> } 
            ], 
            chartData: Array.from({ length: 12 }).map((_, i) => ({ name: monthNames[i], revenue: 50000, profit: 30000 })),
            topCategories: [{ name: 'Inventory', val: 78, color: '#00B0FF' }],
            logs: [{ id: 1, type: 'Alert', msg: 'Stock low on 3 items.', time: '10m ago', path: '/inventory' }]
        };
    }

    if (!realData) return { health: 0, stats: [], chartData: [], topCategories: [], logs: [] };
    const s = realData.summary || {};
    
    return {
        health: Math.round(s.grossMargin || 85),
        chartData: (realData.timeline || []).map(d => ({ name: d.date, revenue: d.revenue || 0, profit: (d.revenue * 0.4) })),
        topCategories: (realData.categoryData || []).slice(0,3).map((c, i) => ({
            name: c.name, val: Math.min(100, Math.round((c.revenue / (s.totalRevenue || 1)) * 100)),
            color: ['#00B0FF', '#00E676', '#885AF8'][i % 3]
        })),
        stats: [
            { label: "Live Sales", val: formatShort(s.totalRevenue), sub: "Total revenue", color: "#00B0FF", icon: <DollarSign/> },
            { label: "Net Profit", val: formatShort(s.netProfit), sub: "Earnings", color: "#00E676", icon: <TrendingUp/> },
            { label: "Overheads", val: formatShort(s.totalOperatingExpenses), sub: "Total bills", color: "#f43f5e", icon: <Receipt/> }
        ],
        logs: (realData.insights || []).map((ins, i) => ({ id: i, type: 'Insight', msg: ins.message, time: 'System', path: '/sales' }))
    };
  }, [isAnalysisMode, realData, viewScope, selectedMonth, selectedYear]);

  const fetchData = useCallback(async () => {
    if (isAnalysisMode) return;
    setIsSyncing(true);
    try {
      const res = await api.get('/sales/report/detailed', { 
        params: { scope: viewScope, month: selectedMonth, year: selectedYear } 
      });
      setRealData(res.data);
    } catch (e) { console.warn("Sync failed."); }
    finally { setTimeout(() => setIsSyncing(false), 600); }
  }, [isAnalysisMode, viewScope, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* HEADER */}
      <HeaderSection>
        <div className="branding">
            <h1>Management <span>Dashboard</span></h1>
            <p>Welcome, <strong>{user?.name}</strong>. Health: <span className="health">{data.health}% Stable</span></p>
        </div>
        
        <ActionHub>
            <div className="mode-pill" onClick={() => setIsAnalysisMode(!isAnalysisMode)}>
                <div className={`dot ${isAnalysisMode ? 'sim' : 'live'}`} />
                <span>{isAnalysisMode ? 'ANALYSIS MODE' : 'LIVE PRODUCTION'}</span>
                <Radio size={14} className={!isAnalysisMode ? 'pulse' : ''} />
            </div>

            <div className="glass-filters">
                <div className="scope-tabs">
                    <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Monthly</button>
                    <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Annual</button>
                </div>
                <div className="pickers">
                    <div className="select-container">
                        <Calendar size={14} />
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {viewScope === 'MONTH' && (
                       <div className="select-container">
                          <Filter size={14} />
                          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                             {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                          </select>
                       </div>
                    )}
                </div>
                <button className={`refresh-btn ${isSyncing ? 'spin' : ''}`} onClick={fetchData} disabled={isAnalysisMode}>
                    <RefreshCcw size={18}/>
                </button>
            </div>
        </ActionHub>
      </HeaderSection>

      {/* KPI TILES (ONLY FINANCIALS NOW) */}
      <MetricsRow>
        {data.stats.map((s, i) => (
          <MetricCard key={i} whileHover={{ y: -5 }}>
             <div className="icon-wrap" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
             <div className="details">
                <label>{s.label}</label>
                <h2>Rwf {s.val}</h2>
                <span className="sub">{s.sub}</span>
             </div>
             <div className="glow" style={{ background: s.color }} />
          </MetricCard>
        ))}
      </MetricsRow>

      {/* BENTO ANALYTICS */}
      <BentoContainer>
        <div className="grid-item span-8">
           <div className="chart-header">
              <h3>Financial Performance</h3>
              <div className="legend">
                  <div className="item"><span className="dot blue"/> Revenue</div>
                  <div className="item"><span className="dot green"/> Profit</div>
              </div>
           </div>
           <div className="canvas">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={data.chartData}>
                    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00B0FF" stopOpacity={0.15}/><stop offset="95%" stopColor="#00B0FF" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{fill:'#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{background: '#000', border: '1px solid #333', borderRadius: '12px'}} 
                        formatter={(val) => `Rwf ${val.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="revenue" fill="url(#areaGrad)" stroke="#00B0FF" strokeWidth={3} />
                    <Line type="monotone" dataKey="profit" stroke="#00E676" strokeWidth={3} dot={{r: 4, fill: '#00E676'}} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="grid-item span-4">
           <h3>Category Performance</h3>
           <div className="stack">
              {data.topCategories.map((cat, i) => (
                <div key={i} className="row">
                   <div className="labels"><span>{cat.name}</span><strong>{cat.val}%</strong></div>
                   <div className="bar-bg"><motion.div className="bar-fill" style={{ background: cat.color }} initial={{ width: 0 }} animate={{ width: `${cat.val}%` }} /></div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid-item span-12">
           <div className="chart-header"><h3>Recent Operational Activity</h3></div>
           <div className="activity-list">
              {data.logs.map((log) => (
                <div key={log.id} className="log-row" onClick={() => navigate(log.path)}>
                   <div className="log-icon">{log.type === 'Alert' ? <AlertTriangle size={16} color="#fbbf24"/> : <Activity size={16} color="#00B0FF"/>}</div>
                   <div className="log-text">
                       <div className="top"><strong>{log.type}</strong><span className="time">{log.time}</span></div>
                       <p>{log.msg}</p>
                   </div>
                   <ChevronRight size={18} />
                </div>
              ))}
           </div>
        </div>
      </BentoContainer>
    </PageWrapper>
  );
};

// --- STYLES ---

const PageWrapper = styled(motion.div)`
  padding: 1.5rem; background: #020617; min-height: 100vh; color: #fff;
  @media (min-width: 1024px) { padding: 3rem; max-width: 1600px; margin: 0 auto; }
`;

const HeaderSection = styled.header`
    display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-bottom: 3rem;
    @media (min-width: 1100px) { flex-direction: row; align-items: center; }
    .branding { h1 { font-size: 2rem; margin: 0; font-weight: 900; letter-spacing: -1.5px; span { color: #00B0FF; } }
        p { color: #64748b; margin: 5px 0 0; font-size: 0.9rem; .health { color: #00E676; font-weight: 800; } } }
`;

const ActionHub = styled.div`
    display: flex; flex-direction: column; align-items: flex-start; gap: 1.2rem;
    @media (min-width: 1100px) { align-items: flex-end; }
    .mode-pill { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
        span { font-size: 0.65rem; font-weight: 900; color: #94a3b8; letter-spacing: 1px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; &.live { background: #00E676; box-shadow: 0 0 10px #00E676; } &.sim { background: #fbbf24; } } }
    
    .glass-filters { display: flex; align-items: center; gap: 12px; background: rgba(15,23,42,0.6); padding: 8px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px);
        .scope-tabs { display: flex; gap: 4px; padding-right: 12px; border-right: 1px solid rgba(255,255,255,0.1);
            button { background: none; border: none; color: #64748b; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s;
                &.active { background: #fff; color: #000; } } }
        .pickers { display: flex; gap: 8px; 
            .select-container { display: flex; align-items: center; gap: 8px; background: #000; border: 1px solid rgba(255,255,255,0.1); padding: 0 10px; border-radius: 10px; color: #64748b;
                select { background: #000; border: none; color: #fff; font-weight: 700; outline: none; cursor: pointer; font-size: 0.85rem; padding: 8px 0; } } }
        .refresh-btn { background: #007BFF; color: white; border: none; width: 38px; height: 38px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
            &:hover { background: #0056b3; transform: scale(1.05); } &.spin { animation: spin 1s linear infinite; } } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const MetricsRow = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; `;

const MetricCard = styled(motion.div)`
  background: #0f172a; padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1.5rem; position: relative; overflow: hidden;
  .icon-wrap { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
  .details { label { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    h2 { margin: 5px 0; font-size: 1.8rem; font-weight: 900; }
    .sub { font-size: 0.75rem; color: #475569; font-weight: 700; } }
  .glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; filter: blur(40px); opacity: 0.15; }
`;

const BentoContainer = styled.div`
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem;
    .grid-item { background: #0f172a; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); padding: 2.5rem; }
    .span-8 { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 8; } }
    .span-4 { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 4; } }
    .span-12 { grid-column: span 12; }
    .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;
        h3 { font-size: 1.1rem; margin: 0; font-weight: 800; color: #94a3b8; }
        .legend { display: flex; gap: 15px; .item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #64748b; .dot { width: 8px; height: 8px; border-radius: 50%; &.blue { background: #00B0FF; } &.green { background: #00E676; } } } } }
    .canvas { height: 350px; width: 100%; }
    .stack { .row { margin-bottom: 2rem; .labels { display: flex; justify-content: space-between; margin-bottom: 10px; span { font-size: 0.85rem; font-weight: 700; color: #94a3b8; } strong { font-size: 0.85rem; color: #fff; } }
        .bar-bg { height: 10px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; .bar-fill { height: 100%; border-radius: 10px; } } } }
    .activity-list { display: grid; grid-template-columns: 1fr; gap: 10px; @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }
        .log-row { display: flex; align-items: center; gap: 15px; padding: 18px; background: rgba(0,0,0,0.2); border-radius: 20px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;
            &:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); transform: translateX(5px); }
            .log-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.03); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
            .log-text { flex: 1; .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; strong { font-size: 0.85rem; color: #fff; } .time { font-size: 0.7rem; color: #475569; } } p { font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.4; } } } }
`;

export default Dashboard;