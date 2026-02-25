import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Activity, Package, RefreshCcw, 
  ChevronRight, ShoppingCart, Shield, User, Server, Radio, 
  Users, Database, BarChart3, Zap, Clock, ArrowUpRight, CheckCircle, Receipt
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

  // --- 1. DATA ENGINE (Upgraded for True Net Profit & OpEx) ---
  const data = useMemo(() => {
    // --- Mode A: SIMULATION (Insightful Mock Data) ---
    if (!isLive) {
        const isYearly = viewScope === 'YEAR';
        const points = isYearly ? 12 : 14;
        const seed = selectedMonth + selectedYear; 

        const chartData = Array.from({ length: points }).map((_, i) => ({
            name: isYearly ? monthNames[i] : `${i + 1}`,
            revenue: 40000 + (Math.sin(i + seed) * 15000) + Math.random() * 5000,
            profit: 20000 + (Math.sin(i + seed) * 10000) + Math.random() * 3000, // True Net
        }));

        const topProducts = [
            { name: 'Inyange Milk', val: 85, color: '#00B0FF' },
            { name: 'Basmati Rice', val: 65, color: '#00E676' },
            { name: 'USB-C Cables', val: 40, color: '#885AF8' },
            { name: 'Movit Soap', val: 30, color: '#FF9100' }
        ];

        const stats = user?.role === 'ADMIN' ? [
            { label: "Registered Users", val: "12", sub: "Platform active", color: "#885AF8", icon: <Users/> },
            { label: "System Uptime", val: "99.9%", sub: "Stable connection", color: "#00E676", icon: <Activity/> },
            { label: "Cloud Nodes", val: "4", sub: "Regional hubs", color: "#00B0FF", icon: <Server/> }
        ] : [
            { label: "Gross Revenue", val: "Rwf 1.4M", growth: "+12%", color: "#00B0FF", icon: <DollarSign/> },
            { label: "True Net Profit", val: "Rwf 520k", growth: "+5%", color: "#00E676", icon: <TrendingUp/> },
            { label: "Op. Expenses", val: "Rwf 150k", sub: "Overheads", color: "#f43f5e", icon: <Receipt/> } 
        ];

        return { health: 94, stats, chartData, topProducts, logs: [{ id: 1, type: 'System', msg: 'Demo environment active.', time: 'Now' }] };
    }

    // --- Mode B: LIVE PRODUCTION (Real Database Data) ---
    if (!realData) return { health: 0, stats: [], chartData: [], topProducts: [], logs: [] };

    // Point to the detailed report structure from backend
    const s = realData.summary || {};
    const processed = {
        health: Math.round(s.grossMargin || 0) || 85,
        chartData: (realData.timeline || []).map(d => ({ name: d.date, revenue: d.revenue || 0, profit: (d.revenue * 0.3) })), 
        logs: (realData.insights || []).map((ins, i) => ({ id: i, type: 'Insight', msg: ins.message, time: 'Generated' })),
        
        // Map top categories to performance bars
        topProducts: (realData.categoryData || []).slice(0,4).map((c, i) => {
            const colors = ['#00B0FF', '#00E676', '#885AF8', '#FF9100'];
            const maxRev = Math.max(...(realData.categoryData || []).map(x => x.revenue));
            return { name: c.name, val: maxRev > 0 ? Math.round((c.revenue/maxRev)*100) : 0, color: colors[i % colors.length] };
        })
    };

    if (processed.topProducts.length === 0) processed.topProducts = [{ name: 'Awaiting Data', val: 0, color: '#00B0FF' }];

    if (user?.role === 'ADMIN') {
        processed.stats = [
            { label: "Real Users", val: realData.userCount || "Active", sub: "Verified accounts", color: "#885AF8", icon: <Users/> },
            { label: "System Health", val: `${processed.health}%`, sub: "Resource status", color: "#00E676", icon: <Activity/> },
            { label: "Database", val: "Online", sub: "Secure Link", color: "#00B0FF", icon: <Database/> }
        ];
    } else {
        processed.stats = [
            { label: "Total Sales", val: `Rwf ${(s.totalRevenue || 0).toLocaleString()}`, color: "#00B0FF", icon: <DollarSign/> },
            { label: "True Net Profit", val: `Rwf ${(s.netProfit || 0).toLocaleString()}`, color: "#00E676", icon: <TrendingUp/> },
            { label: "Op. Expenses", val: `Rwf ${(s.totalOperatingExpenses || 0).toLocaleString()}`, color: "#f43f5e", icon: <Receipt/> } 
        ];
    }
    return processed;
  }, [isLive, realData, user?.role, viewScope, selectedYear, selectedMonth]);

  const fetchData = useCallback(async () => {
    if (!isLive) return;
    setIsSyncing(true);
    try {
      const res = await api.get('/sales/report/detailed', { params: { scope: viewScope, month: selectedMonth, year: selectedYear } });
      setRealData(res.data);
    } catch (e) { console.error("Sync Error"); }
    finally { setTimeout(() => setIsSyncing(false), 500); }
  }, [isLive, viewScope, selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HEADER / BRIEFING */}
      <ExecutiveBrief>
        <div className="brief-content">
            <div className="avatar-capsule">
                <div className="logo-ring"><img src="/logo.png" alt="Invento" /></div>
                <div className="online-badge" />
            </div>
            <div className="text-area">
                <h1>Welcome, <span>{user?.name || "User"}</span></h1>
                <p>
                    Your business is operating at a <span className="health-txt">{data.health}% health score</span>. 
                    Viewing data for {monthNames[selectedMonth-1]} {selectedYear}.
                </p>
            </div>
        </div>
        
        <ControlHub>
            <div className="live-toggle" onClick={() => setIsLive(!isLive)}>
                <div className={`dot ${isLive ? 'live' : 'sim'}`} />
                <span>{isLive ? 'LIVE DATA' : 'DEMO MODE'}</span>
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

      {/* KPI TILES (Mobile responsive) */}
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
              <h3>{user?.role === 'ADMIN' ? 'Platform Usage' : 'Revenue vs Net Profit'}</h3>
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
              <div className="gauge-val"><h2>{data.health}%</h2><span>Health</span></div>
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
              <Activity size={14} color="#00B0FF" style={{flexShrink:0}}/>
              <p>Business vitals are currently within target margins.</p>
           </div>
        </div>

        {/* CHART 3: PERFORMANCE BARS */}
        <div className="grid-item span-6 bar-card">
           <div className="card-header">
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                 <BarChart3 size={18} color="#885AF8"/>
                 <h3> Top Selling Categories</h3>
              </div>
           </div>
           <div className="performance-list">
              {data.topProducts.map((p, i) => (
                <div key={i} className="perf-row">
                   <div className="labels"><span>{p.name}</span><strong>{p.val}%</strong></div>
                   <div className="bar-bg"><motion.div className="fill" style={{background: p.color}} initial={{width: 0}} animate={{width: `${p.val}%`}} transition={{duration:1}} /></div>
                </div>
              ))}
           </div>
        </div>

        {/* LOG STREAM - Professional Wording */}
        <div className="grid-item span-6 log-card">
           <div className="card-header"><h3>System Insights & Alerts</h3></div>
           <div className="log-list">
              {data.logs.map((log) => (
                <div key={log.id} className="log-item">
                   <div className="line" />
                   <div className="content"><strong>{log.type}</strong><p>{log.msg}</p></div>
                   <span className="time">{log.time}</span>
                </div>
              ))}
              {data.logs.length === 0 && <div className="log-item"><p style={{color:'#64748b', fontSize:'0.85rem'}}>No new insights for the selected period.</p></div>}
           </div>
           <button className="full-btn" onClick={() => navigate(user?.role === 'ADMIN' ? '/users' : '/sales')}>View Detailed Ledgers <ArrowUpRight size={14}/></button>
        </div>
      </BentoLayout>

    </PageWrapper>
  );
};

export default Dashboard;

// --- STYLES (Strictly Responsive & Mobile-First) ---

const PageWrapper = styled(motion.div)`
  width: 100%; max-width: 100vw; box-sizing: border-box; overflow-x: hidden;
  padding: 1rem; color: white; background: #04080F; min-height: 100vh;
  @media (min-width: 768px) { padding: 1.5rem; }
  @media (min-width: 1024px) { padding: 2.5rem; max-width: 1500px; margin: 0 auto; }
  *, *::before, *::after { box-sizing: border-box; }
`;

const ExecutiveBrief = styled.header`
    display: flex; flex-direction: column; align-items: flex-start; gap: 1.5rem; margin-bottom: 3rem; width: 100%;
    @media (min-width: 900px) { flex-direction: row; justify-content: space-between; align-items: center; }

    .brief-content { display: flex; align-items: center; gap: 1.2rem; width: 100%;
        .avatar-capsule { width: 60px; height: 60px; position: relative; flex-shrink: 0;
            .logo-ring { height: 100%; width: 100%; background: white; border-radius: 18px; padding: 10px; img { width: 100%; object-fit: contain; } }
            .online-badge { position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; background: #00E676; border-radius: 50%; border: 3px solid #04080F; } }
        .text-area { 
            h1 { font-size: 1.6rem; margin: 0 0 4px; font-weight: 900; letter-spacing: -1px; span { color: #00B0FF; } } 
            p { color: #64748b; font-size: 0.85rem; margin: 0; line-height: 1.4; .health-txt { color: #00E676; font-weight: 800; } } } 
    }
`;

const ControlHub = styled.div`
    display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; width: 100%;
    @media (min-width: 900px) { align-items: flex-end; width: auto; }

    .live-toggle { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
        span { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; } .dot { width: 8px; height: 8px; border-radius: 50%; &.live { background: #00E676; } &.sim { background: #FF9100; } } }
    
    .glass-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; background: rgba(13,31,45,0.6); padding: 8px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); width: 100%;
        @media (min-width: 600px) { width: auto; flex-wrap: nowrap; }
        .scope-pills { display: flex; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 12px;
            button { border: none; background: none; color: #64748b; padding: 6px 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; &.active { background: white; color: black; border-radius: 8px; } } }
        select { background: none; border: none; color: white; font-weight: 700; cursor: pointer; outline: none; font-size: 0.85rem; padding: 0 5px;}
        .sync-btn { background: #007BFF; color: white; border: none; width: 36px; height: 36px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: 0.2s; &:hover{ background: #0056b3;} &.spin { animation: rotate 1s linear infinite; } } }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const MetricsGrid = styled.div` 
    display: grid; 
    grid-template-columns: 1fr; /* Strict mobile stack */
    gap: 1rem; 
    margin-bottom: 2.5rem; 
    width: 100%;
    @media (min-width: 600px) { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
`;

const StatCard = styled(motion.div)`
    background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1.2rem; width: 100%;
    .icon-box { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .info { flex: 1; min-width: 0; label { display: block; font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;} h3 { font-size: 1.4rem; margin: 4px 0; font-weight: 900; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;} p { font-size: 0.75rem; color: #94a3b8; margin: 0;} }
`;

const BentoLayout = styled.div`
    display: grid; 
    grid-template-columns: 1fr; /* Strict mobile stack */
    gap: 1.5rem; 
    width: 100%;

    @media (min-width: 1024px) { grid-template-columns: repeat(12, 1fr); }

    .grid-item { background: rgba(13,31,45,0.4); border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; width: 100%; @media (min-width: 768px) { padding: 2rem; } }
    
    /* Desktop Spans */
    @media (min-width: 1024px) {
        .span-8 { grid-column: span 8; } 
        .span-4 { grid-column: span 4; } 
        .span-6 { grid-column: span 6; } 
    }

    h3 { margin: 0 0 1.5rem 0; font-size: 1.1rem; color: #94a3b8; font-weight: 800;}
    .card-header { display: flex; justify-content: space-between; align-items: center; .legend { display: flex; gap: 12px; font-size: 0.75rem; font-weight: 700; color: #64748b; .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; &.blue { background: #00B0FF; } &.green { background: #00E676; } } } }
    
    .canvas { height: 280px; width: 100%; }
    
    .gauge-box { position: relative; display: flex; align-items: center; justify-content: center; .gauge-val { position: absolute; text-align: center; h2 { margin: 0; font-size: 2rem; } span { color: #64748b; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; } } }
    .insight-note { margin-top: 1.5rem; display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; p { font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4;} }
    
    .performance-list { .perf-row { margin-bottom: 1.2rem; .labels { display: flex; justify-content: space-between; margin-bottom: 6px; span { font-size: 0.85rem; font-weight: 700; color: #e2e8f0; } strong { font-size: 0.85rem; } } .bar-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; .fill { height: 100%; border-radius: 10px; } } } }
    
    .log-list { .log-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 10px; .line { width: 3px; height: 35px; background: #00B0FF; border-radius: 10px; flex-shrink: 0; } .content { flex: 1; strong { font-size: 0.85rem; display: block; margin-bottom: 2px;} p { font-size: 0.75rem; color: #64748b; margin: 0; line-height: 1.4; } } .time { font-size: 0.7rem; color: #475569; white-space: nowrap; } } }
    
    .full-btn { width: 100%; padding: 14px; margin-top: 1rem; background: rgba(0, 176, 255, 0.05); border: 1px dashed rgba(0, 176, 255, 0.3); border-radius: 12px; color: #00B0FF; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; &:hover { background: rgba(0, 176, 255, 0.1); } }
`;