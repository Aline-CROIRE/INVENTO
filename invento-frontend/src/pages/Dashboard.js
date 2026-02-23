import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Activity, Package, RefreshCcw, 
  ChevronRight, ShoppingCart, Shield, User, Server, Radio, 
  Users, Database, BarChart3, Zap, Clock, ArrowUpRight, CheckCircle
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Line, ComposedChart 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  
  // --- STATE ---
  const [isLive, setIsLive] = useState(false);
  const [viewScope, setViewScope] = useState('MONTH'); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realData, setRealData] = useState(null);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- 1. DATA ENGINE ---
  const data = useMemo(() => {
    // --- Mode A: SIMULATION (Insightful Mock Data) ---
    if (!isLive) {
        const isYearly = viewScope === 'YEAR';
        const points = isYearly ? 12 : 14;
        const seed = selectedMonth + selectedYear; // Makes Jan different from Feb

        const chartData = Array.from({ length: points }).map((_, i) => ({
            name: isYearly ? monthNames[i] : `${i + 1}`,
            revenue: 40000 + (Math.sin(i + seed) * 15000) + Math.random() * 5000,
            profit: 20000 + (Math.sin(i + seed) * 10000) + Math.random() * 3000,
        }));

        const topProducts = [
            { name: 'Inyange Milk', val: 85, color: '#00B0FF' },
            { name: 'Basmati Rice', val: 65, color: '#00E676' },
            { name: 'USB-C Cables', val: 40, color: '#885AF8' },
            { name: 'Movit Soap', val: 30, color: '#FF9100' }
        ];

        const stats = user?.role === 'ADMIN' ? [
            { label: "Registered Users", val: "12", sub: "Platform active", color: "#885AF8", icon: <Users/> },
            { label: "System Uptime", val: "99.9%", sub: "Simulated load", color: "#00E676", icon: <Activity/> },
            { label: "Cloud Nodes", val: "4", sub: "Regional hubs", color: "#00B0FF", icon: <Server/> }
        ] : [
            { label: "Expt. Revenue", val: "Rwf 1.4M", growth: "+12%", color: "#00B0FF", icon: <DollarSign/> },
            { label: "Expt. Profit", val: "Rwf 520k", growth: "+5%", color: "#00E676", icon: <TrendingUp/> },
            { label: "Active Stock", val: "842", sub: "Total Units", color: "#FF9100", icon: <Package/> }
        ];

        return { health: 94, stats, chartData, topProducts, logs: [{ id: 1, type: 'Sim', msg: 'Neural simulation active.', time: 'Now' }] };
    }

    // --- Mode B: LIVE PRODUCTION (Real Database Data) ---
    if (!realData) return { health: 0, stats: [], chartData: [], topProducts: [], logs: [] };

    const m = realData.metrics || {};
    const processed = {
        health: realData.healthScore || 0,
        chartData: (realData.chartData || []).map(d => ({ name: d.label || d.date, revenue: d.revenue || d.value, profit: d.profit || 0 })),
        logs: (realData.insights || []).map((ins, i) => ({ id: i, type: 'Insight', msg: ins.message, time: 'Just now' })),
        topProducts: [{ name: 'Current Month Revenue', val: 100, color: '#00B0FF' }] // Defaulting bar for live
    };

    if (user?.role === 'ADMIN') {
        processed.stats = [
            { label: "Real Users", val: realData.userCount || "3", sub: "Verified accounts", color: "#885AF8", icon: <Users/> },
            { label: "System Health", val: `${realData.healthScore || 0}%`, sub: "Resource status", color: "#00E676", icon: <Activity/> },
            { label: "Data Nodes", val: "1", sub: "Database Link", color: "#00B0FF", icon: <Database/> }
        ];
    } else {
        processed.stats = [
            { label: "Total Sales", val: `Rwf ${m.monthlyRevenue?.toLocaleString() || 0}`, color: "#00B0FF", icon: <DollarSign/> },
            { label: "Net Earnings", val: `Rwf ${m.monthlyNetProfit?.toLocaleString() || 0}`, color: "#00E676", icon: <TrendingUp/> },
            { label: "Inventory Value", val: `Rwf ${m.totalAssetValue?.toLocaleString() || 0}`, color: "#FF9100", icon: <Package/> }
        ];
    }
    return processed;
  }, [isLive, realData, user?.role, viewScope, selectedYear, selectedMonth]);

  const fetchData = useCallback(async () => {
    if (!isLive) return;
    setIsSyncing(true);
    try {
      const res = await api.get('/insights/dashboard', { params: { month: selectedMonth, year: selectedYear } });
      setRealData(res.data);
    } catch (e) { console.error("Sync Error"); }
    finally { setTimeout(() => setIsSyncing(false), 500); }
  }, [isLive, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* REDESIGNED EXECUTIVE HELLO / BRIEFING */}
      <ExecutiveBrief>
        <div className="brief-content">
            <div className="avatar-capsule">
                <div className="logo-ring"><img src="/logo.png" alt="Invento" /></div>
                <div className="online-badge" />
            </div>
            <div className="text-area">
                <h1>Command Briefing: {user?.name || "Operator"}</h1>
                <p>
                    System nodes report <span className="health-txt">{data.health}% efficiency</span>. 
                    Monitoring <strong>{user?.role}</strong> sector for {monthNames[selectedMonth-1]} {selectedYear}.
                </p>
            </div>
        </div>
        
        <ControlHub>
            <div className="live-toggle" onClick={() => setIsLive(!isLive)}>
                <div className={`dot ${isLive ? 'live' : 'sim'}`} />
                <span>{isLive ? 'PRODUCTION LIVE' : 'SIMULATION MODE'}</span>
                <Radio size={12} className={isLive ? 'pulse' : ''} />
            </div>
            <div className="glass-filters">
                <div className="scope-pills">
                    <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Monthly</button>
                    <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Annual</button>
                </div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {viewScope === 'MONTH' && (
                   <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                      {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                   </select>
                )}
                <button className={`sync-btn ${isSyncing ? 'spin' : ''}`} onClick={fetchData}><RefreshCcw size={16}/></button>
            </div>
        </ControlHub>
      </ExecutiveBrief>

      {/* KPI TILES */}
      <MetricsGrid>
        {data.stats.map((s, i) => (
          <StatCard key={i} whileHover={{ y: -5 }}>
             <div className="icon-box" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
             <div className="info">
                <label>{s.label}</label>
                <h3>{s.val}</h3>
                <p>{s.sub || s.growth}</p>
             </div>
          </StatCard>
        ))}
      </MetricsGrid>

      {/* ADVANCED BENTO GRID */}
      <BentoLayout>
        {/* CHART 1: MAIN TREND */}
        <div className="grid-item span-8 chart-card">
           <div className="card-header">
              <h3>{user?.role === 'ADMIN' ? 'Resource Flow' : 'Revenue Velocity'}</h3>
              <div className="legend"><span className="dot blue"/> Revenue <span className="dot green"/> Profit</div>
           </div>
           <div className="canvas">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                 <ComposedChart data={data.chartData}>
                    <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00B0FF" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#00B0FF" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{fill:'#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{background: '#0D1F2D', border: 'none', borderRadius: '15px'}} />
                    <Area type="monotone" dataKey="revenue" fill="url(#colorArea)" stroke="#00B0FF" strokeWidth={3} />
                    <Line type="monotone" dataKey="profit" stroke="#00E676" strokeWidth={2} dot={{r:4}} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* CHART 2: HEALTH GAUGE */}
        <div className="grid-item span-4 pie-card">
           <h3>Operational Score</h3>
           <div className="gauge-box">
              <div className="gauge-val"><h2>{data.health}%</h2><span>Stable</span></div>
              <ResponsiveContainer width="100%" height={180}>
                 <PieChart>
                    <Pie data={[{v: data.health}, {v: 100-data.health}]} innerRadius={60} outerRadius={80} startAngle={90} endAngle={450} dataKey="v" stroke="none">
                       <Cell fill="#00E676" />
                       <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="insight-note">
              <Activity size={14} color="#00B0FF"/>
              <p>Business vitals are currently within target margins.</p>
           </div>
        </div>

        {/* CHART 3: PERFORMANCE BARS */}
        <div className="grid-item span-6 bar-card">
           <div className="card-header">
              <BarChart3 size={18} color="#885AF8"/>
              <h3> Top Selling Products</h3>
           </div>
           <div className="performance-list">
              {data.topProducts.map((p, i) => (
                <div key={i} className="perf-row">
                   <div className="labels"><span>{p.name}</span><strong>{p.val}%</strong></div>
                   <div className="bar-bg"><motion.div className="fill" style={{background: p.color}} initial={{width: 0}} animate={{width: `${p.val}%`}} /></div>
                </div>
              ))}
           </div>
        </div>

        {/* LOG STREAM */}
        <div className="grid-item span-6 log-card">
           <div className="card-header"><h3>Neural Signal Stream</h3></div>
           <div className="log-list">
              {data.logs.map((log) => (
                <div key={log.id} className="log-item">
                   <div className="line" />
                   <div className="content"><strong>{log.type}</strong><p>{log.msg}</p></div>
                   <span className="time">{log.time}</span>
                </div>
              ))}
           </div>
           <button className="full-btn" onClick={() => navigate('/inventory')}>Global Registry <ArrowUpRight size={14}/></button>
        </div>
      </BentoLayout>

    </PageWrapper>
  );
};

// --- STYLES ---

const PageWrapper = styled(motion.div)`
  padding: 1.5rem; max-width: 1500px; margin: 0 auto; color: white; background: #04080F; min-height: 100vh;
  @media (min-width: 768px) { padding: 2.5rem; }
`;

const ExecutiveBrief = styled.header`
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem; flex-wrap: wrap; gap: 2rem;
    .brief-content { display: flex; align-items: center; gap: 1.5rem;
        .avatar-capsule { width: 70px; height: 70px; position: relative;
            .logo-ring { height: 100%; width: 100%; background: white; border-radius: 20px; padding: 12px; img { width: 100%; object-fit: contain; } }
            .online-badge { position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px; background: #00E676; border-radius: 50%; border: 4px solid #04080F; } }
        .text-area { h1 { font-size: 2.2rem; margin: 0; font-weight: 900; letter-spacing: -1.5px; } p { color: #64748b; font-size: 1rem; .health-txt { color: #00E676; font-weight: 800; } } } }
`;

const ControlHub = styled.div`
    display: flex; flex-direction: column; align-items: flex-end; gap: 1rem;
    .live-toggle { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px 18px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
        span { font-size: 0.7rem; font-weight: 800; color: #94a3b8; } .dot { width: 8px; height: 8px; border-radius: 50%; &.live { background: #00E676; } &.sim { background: #FF9100; } } }
    .glass-filters { display: flex; align-items: center; gap: 1rem; background: rgba(13,31,45,0.6); padding: 8px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
        .scope-pills { display: flex; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 12px;
            button { border: none; background: none; color: #64748b; padding: 8px 18px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; &.active { background: white; color: black; border-radius: 8px; } } }
        select { background: none; border: none; color: white; font-weight: 700; cursor: pointer; outline: none; }
        .sync-btn { background: #007BFF; color: white; border: none; width: 38px; height: 38px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; &.spin { animation: rotate 1s linear infinite; } } }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const MetricsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 3.5rem; `;

const StatCard = styled(motion.div)`
    background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 35px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1.5rem;
    .icon-box { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
    .info { label { font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; } h3 { font-size: 1.8rem; margin: 4px 0; font-weight: 900; } p { font-size: 0.85rem; color: #94a3b8; } }
`;

const BentoLayout = styled.div`
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem;
    .grid-item { background: rgba(13,31,45,0.4); border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); padding: 2.5rem; }
    .span-8 { grid-column: span 8; } .span-4 { grid-column: span 4; } .span-6 { grid-column: span 6; } .span-12 { grid-column: span 12; }
    @media (max-width: 1200px) { .span-8, .span-4, .span-6 { grid-column: span 12; } }
    h3 { margin: 0 0 1.5rem 0; font-size: 1.2rem; color: #94a3b8; }
    .card-header { display: flex; justify-content: space-between; align-items: center; .legend { display: flex; gap: 15px; font-size: 0.8rem; font-weight: 700; color: #64748b; .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 6px; &.blue { background: #00B0FF; } &.green { background: #00E676; } } } }
    .canvas { height: 350px; }
    .gauge-box { position: relative; display: flex; align-items: center; justify-content: center; .gauge-val { position: absolute; text-align: center; h2 { margin: 0; font-size: 2.2rem; } span { color: #64748b; font-weight: 800; font-size: 0.7rem; } } }
    .insight-note { margin-top: 2rem; display: flex; gap: 10px; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 15px; p { font-size: 0.85rem; color: #94a3b8; margin: 0; } }
    .performance-list { .perf-row { margin-bottom: 1.2rem; .labels { display: flex; justify-content: space-between; margin-bottom: 8px; span { font-size: 0.9rem; font-weight: 700; } } .bar-bg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; .fill { height: 100%; border-radius: 10px; } } } }
    .log-list { .log-item { display: flex; align-items: center; gap: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 18px; margin-bottom: 1rem; .line { width: 4px; height: 30px; background: #00B0FF; border-radius: 10px; } .content { flex: 1; strong { font-size: 0.9rem; } p { font-size: 0.8rem; color: #64748b; margin: 0; } } .time { font-size: 0.75rem; color: #475569; } } }
    .full-btn { width: 100%; padding: 12px; background: none; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; color: #00B0FF; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
`;

export default Dashboard;