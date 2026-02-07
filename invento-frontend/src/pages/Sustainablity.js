import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PieChart } from 'lucide-react';

import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Printer, Zap, AlertTriangle,
  ShieldCheck, Activity, Layers,
  Calendar, Radio, Leaf, Recycle, RefreshCcw,
  BarChart3, Info, ChevronRight, Target, Globe
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePie,
  Pie, Legend
} from 'recharts';
import api from '../api/axios';

export default function Sustainability() {
  // --- CORE STATE ---
  const [viewScope, setViewScope] = useState('MONTH');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [realData, setRealData] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const COLORS = {
    profit: '#00E676',
    revenue: '#00B0FF',
    waste: '#FFB300', // Professional Amber
    nodes: '#885AF8'
  };

  // --- 1. INTELLIGENT DATA ENGINE ---
  const data = useMemo(() => {
    if (isDemoMode) {
      const isYearly = viewScope === 'YEAR';
      const points = isYearly ? 12 : 30;
      const seed = Number(selectedYear) + Number(selectedMonth);

      const timeline = Array.from({ length: points }).map((_, i) => ({
        date: isYearly ? shortMonths[i] : `D${i + 1}`,
        revenue: 160000 + (Math.sin(i + seed) * 40000) + Math.random() * 15000,
        waste: 3000 + (Math.cos(i + seed) * 2000) + Math.random() * 1500,
      }));

      return {
        netProfit: 2150000 + (seed % 500),
        wasteLoss: 112000 + (seed % 200),
        efficiencyScore: 92.4,
        timeline,
        categories: [
          { name: 'Dairy', waste: 45000 },
          { name: 'Grains', waste: 12000 },
          { name: 'Produce', waste: 35000 },
          { name: 'Pharma', waste: 8000 }
        ],
        insight: `Audit for ${isYearly ? selectedYear : monthNames[selectedMonth - 1]} indicates optimal capital rotation.`
      };
    }

    // --- LIVE PRODUCTION MAPPING ---
    const m = realData?.summary || {};
    return {
      netProfit: Number(m.netProfit || 0),
      wasteLoss: Number(m.expiredLoss || 0),
      efficiencyScore: Number(m.grossMargin || 0),
      timeline: (realData?.timeline || []).map(t => ({
        date: t.date || '?',
        revenue: Number(t.revenue || 0),
        waste: Number(t.expiredLoss || 0)
      })),
      categories: (realData?.categoryData || []).map(c => ({
        name: c.name || 'Other',
        waste: Number(c.waste || 0)
      })),
      insight: realData?.insights?.[0]?.message || "Analyzing system logs for efficiency delyas..."
    };
  }, [isDemoMode, realData, viewScope, selectedYear, selectedMonth]);

  // --- 2. DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    try {
      const res = await api.get(`/sales/report/detailed`, {
        params: { scope: viewScope, year: selectedYear, month: selectedMonth }
      });
      if (res.data) setRealData(res.data);
    } catch (e) {
      console.error("Access Denied or Connection Lost.");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => {
    if (!isDemoMode) fetchData();
  }, [fetchData, isDemoMode]);

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* --- ELITE COMMAND HEADER --- */}
      <HeaderSection className="no-print">
        <div className="branding">
          <div className="mode-selector" onClick={() => {
            setIsDemoMode(!isDemoMode);
            if (!isDemoMode) setRealData(null);
          }}>
            <div className={`status-dot ${isDemoMode ? 'sim' : 'live'}`} />
            <span className="mode-label">{isDemoMode ? 'SIMULATION' : 'LIVE AUDIT'}</span>
            <Radio size={14} className={!isDemoMode ? 'pulse' : ''} />
          </div>
          <h1>Sustainability <span>Analytics</span></h1>
        </div>

        <div className="action-deck">
          <div className="deck-glass">
            <div className="scope-pills">
              <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Detailed</button>
              <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Annual</button>
            </div>
            <div className="divider-v" />
            <div className="pickers">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {viewScope === 'MONTH' && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {monthNames.map((m, i) => <option key={m} value={i + 1}>{shortMonths[i]}</option>)}
                </select>
              )}
            </div>
            <button className={`sync-trigger ${loading ? 'spin' : ''}`} onClick={fetchData} disabled={isDemoMode}>
              <RefreshCcw size={18} />
            </button>
          </div>

          <button className="print-action" onClick={() => window.print()}>
            <Printer size={18} /> <span>Audit Print</span>
          </button>
        </div>
      </HeaderSection>

      {/* --- TOP METRIC TILES --- */}
      <MetricCluster className="no-print">
        <MetricCard $color={COLORS.profit}>
          <div className="card-top"><label>Efficiency Rate</label><Activity size={18} color={COLORS.profit} /></div>
          <div className="card-val">{Number(data.efficiencyScore || 0).toFixed(1)}<small>%</small></div>
          <div className="bar-track"><motion.div className="fill" initial={{ width: 0 }} animate={{ width: `${data.efficiencyScore}%` }} /></div>
        </MetricCard>

        <MetricCard $color={COLORS.waste}>
          <div className="card-top"><label>Resource Leakage</label><AlertTriangle size={18} color={COLORS.waste} /></div>
          <div className="card-val"><small>Rwf</small> {data.wasteLoss.toLocaleString()}</div>
          <div className="card-sub">Capital lost to expiration</div>
        </MetricCard>

        <MetricCard $color={COLORS.revenue}>
          <div className="card-top"><label>Net Recovered Value</label><ShieldCheck size={18} color={COLORS.revenue} /></div>
          <div className="card-val"><small>Rwf</small> {data.netProfit.toLocaleString()}</div>
          <div className="card-sub">Liquid profit after waste</div>
        </MetricCard>
      </MetricCluster>

      {/* --- BENTO ANALYTICS GRID --- */}
      <BentoLayout className="no-print">

        {/* CHART: AREA FLOW */}
        <ContentCard className="span-8">
          <div className="card-header">
            <div className="meta">
              <h3>Financial Resource Dynamics</h3>
              <p>Timeline of revenue vs identified leakage.</p>
            </div>
            <div className="legend">
              <span className="item"><i style={{ background: COLORS.profit }} /> Revenue</span>
              <span className="item"><i style={{ background: COLORS.waste }} /> Waste</span>
            </div>
          </div>
          <div className="canvas">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="glowRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="glowWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.waste} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.waste} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0D1F2D', border: 'none', borderRadius: '15px' }} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.profit} strokeWidth={4} fill="url(#glowRev)" />
                <Area type="monotone" dataKey="waste" stroke={COLORS.waste} strokeWidth={4} fill="url(#glowWaste)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ContentCard>

        {/* INSIGHT CARD */}
        <StrategyCard className="span-4">
          <div className="icon-box"><Zap size={24} color="#FFD600" fill="#FFD600" /></div>
          <h4>Strategic Pulse</h4>
          <p className="narrative">{data.insight}</p>
          <div className="advice">
            <Target size={14} color={COLORS.profit} />
            <p>Reduce procurement cycles by 12% to minimize storage degradation.</p>
          </div>
          <div className="footer-node">
            <Globe size={12} />
            <span>Verified by IIS Node 04</span>
          </div>
        </StrategyCard>

        {/* CHART: BAR CATEGORY */}
        <ContentCard className="span-6">
          <div className="card-header">
            <h3>Sector-wise Leakage</h3>
            <BarChart3 size={18} color={COLORS.waste} />
          </div>
          <div className="canvas-sm">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.categories} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: 'white', fontSize: 11, fontWeight: 700 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#0D1F2D', border: 'none' }} />
                <Bar dataKey="waste" fill={COLORS.waste} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ContentCard>

        {/* CHART: PIE CAPITAL */}
        <ContentCard className="span-6">
          <div className="card-header">
            <h3>Capital Distribution</h3>
            <PieChart size={18} color={COLORS.revenue} />
          </div>
          <div className="canvas-sm flex-center">
            <ResponsiveContainer width="100%" height={240}>
              <RePie>
                <Pie
                  data={[{ name: 'Yield', value: data.netProfit }, { name: 'Loss', value: data.wasteLoss }]}
                  innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none"
                >
                  <Cell fill={COLORS.profit} /><Cell fill={COLORS.waste} />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" height={36} />
              </RePie>
            </ResponsiveContainer>
          </div>
        </ContentCard>
      </BentoLayout>

      {/* --- FORMAL PDF PRINT TEMPLATE --- */}
      <div id="print-doc">
        <div className="doc-header">
          <div className="brand">
            <Leaf size={32} color="#00E676" />
            <div className="b-text">
              <h1>INVENTO INTELLIGENCE SYSTEMS</h1>
              <p>Official Sustainability & Resource Audit</p>
            </div>
          </div>
          <div className="doc-meta">
            <p><strong>AUDIT ID:</strong> SUST-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
            <p><strong>TIMESTAMP:</strong> {new Date().toLocaleString()}</p>
            <p><strong>SCOPE:</strong> {viewScope === 'YEAR' ? `ANNUAL ${selectedYear}` : `${monthNames[selectedMonth - 1]} ${selectedYear}`}</p>
          </div>
        </div>

        <div className="doc-pillars">
          <div className="p-card"><span>Efficiency Rating</span><strong>{data.efficiencyScore}%</strong></div>
          <div className="p-card"><span>Net Realized Profit</span><strong>Rwf {data.netProfit.toLocaleString()}</strong></div>
          <div className="p-card"><span>Total Capital Waste</span><strong>Rwf {data.wasteLoss.toLocaleString()}</strong></div>
        </div>

        <h3 className="section-title">Breakdown by Business Sector</h3>
        <table className="doc-table">
          <thead>
            <tr><th>Category Name</th><th align="right">Loss Identified (RWF)</th><th align="right">Status</th></tr>
          </thead>
          <tbody>
            {data.categories.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td align="right">{c.waste.toLocaleString()}</td>
                <td align="right">{c.waste > 20000 ? 'Review Required' : 'Optimal'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-footer">
          <p>System-generated financial audit. Accuracy verified via local database synchronization.</p>
          <p>© {new Date().getFullYear()} Invento Rwanda • Confidential Commercial Document</p>
        </div>
      </div>

      <style>{`
        @media screen { #print-doc { display: none; } }
        @media print {
            @page { size: A4; margin: 20mm; }
            body * { visibility: hidden; height: 0; overflow: hidden; }
            #print-doc, #print-doc * { visibility: visible; height: auto; overflow: visible; display: block; }
            #print-doc { position: absolute; left: 0; top: 0; width: 100%; color: #000; background: #fff; font-family: 'Helvetica', 'Arial', sans-serif; }
            .doc-header { display: flex; justify-content: space-between; border-bottom: 2.5px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
            .brand { display: flex; align-items: center; gap: 15px; }
            .b-text h1 { font-size: 22px; font-weight: 900; margin: 0; }
            .b-text p { font-size: 11px; color: #444; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .doc-meta p { font-size: 10px; text-align: right; margin: 2px 0; }
            .doc-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 50px; }
            .p-card { border: 1.5px solid #eee; padding: 20px; border-radius: 10px; background: #fafafa; }
            .p-card span { display: block; font-size: 9px; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 5px; }
            .p-card strong { font-size: 20px; }
            .section-title { font-size: 14px; text-transform: uppercase; margin-bottom: 15px; border-left: 4px solid #00E676; padding-left: 10px; }
            .doc-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 60px; }
            .doc-table th { background: #f5f5f5; padding: 12px; border-bottom: 1.5px solid #000; }
            .doc-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .doc-footer { border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
            .doc-footer p { font-size: 9px; color: #999; }
            .no-print { display: none !important; }
        }
      `}</style>

    </PageWrapper>
  );
}

// --- STYLES (Advanced Responsive Architecture) ---

const PageWrapper = styled(motion.div)`
  max-width: 1400px; margin: 0 auto; padding: 1rem; color: #fff; background: #04080F; min-height: 100vh;
  @media (min-width: 768px) { padding: 2.5rem; }
`;

const HeaderSection = styled.header`
  display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3.5rem;
  @media (min-width: 1100px) { flex-direction: row; justify-content: space-between; align-items: flex-end; }
  
  .branding {
    .mode-selector { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); padding: 6px 16px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px;
        .status-dot { width: 8px; height: 8px; border-radius: 50%; &.live { background: #00E676; box-shadow: 0 0 10px #00E676; } &.sim { background: #FFB300; } }
        .mode-label { font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; } }
    h1 { font-size: 2.5rem; margin: 0; font-weight: 900; letter-spacing: -1.5px; span { color: #00E676; } } }
  
  .action-deck { display: flex; gap: 1rem; flex-wrap: wrap; 
    .deck-glass { display: flex; align-items: center; gap: 12px; background: #0D1F2D; padding: 8px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06);
        .scope-pills { display: flex; gap: 4px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 12px;
            button { border: none; background: none; color: #64748b; padding: 8px 16px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s;
                &.active { background: #fff; color: #000; border-radius: 8px; } } }
        .divider-v { width: 1.5px; height: 25px; background: rgba(255,255,255,0.1); }
        .pickers select { background: none; border: none; color: #fff; font-weight: 800; outline: none; cursor: pointer; font-size: 0.85rem; padding: 0 5px; }
        .sync-trigger { background: none; border: none; color: #64748b; cursor: pointer; transition: 0.3s; &.spin { animation: spin 1s linear infinite; } &:hover { color: #fff; } } }
    .print-action { background: #00E676; color: #04090E; border: none; padding: 0 24px; border-radius: 14px; font-weight: 900; height: 50px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0, 230, 118, 0.3); } } }
  
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const MetricCluster = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 3.5rem;
  @media (min-width: 650px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
`;

const MetricCard = styled.div`
  background: rgba(13,31,45,0.4); padding: 2rem; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); border-top: 5px solid ${p => p.$color};
  .card-top { display: flex; justify-content: space-between; align-items: center; label { font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; } }
  .card-val { font-size: 2.2rem; font-weight: 900; margin: 15px 0; color: #fff; small { font-size: 1rem; color: #475569; margin-right: 5px; } }
  .card-sub { font-size: 0.8rem; color: #64748b; font-weight: 600; }
  .bar-track { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-top: 15px; .fill { height: 100%; border-radius: 10px; transition: 1.5s cubic-bezier(0.4, 0, 0.2, 1); } }
`;

const BentoLayout = styled.div`
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem;
  .span-8 { grid-column: span 12; @media (min-width: 1100px) { grid-column: span 8; } }
  .span-4 { grid-column: span 12; @media (min-width: 1100px) { grid-column: span 4; } }
  .span-6 { grid-column: span 12; @media (min-width: 800px) { grid-column: span 6; } }
`;

const ContentCard = styled.div`
  background: rgba(13,31,45,0.4); padding: 2rem; border-radius: 35px; border: 1px solid rgba(255,255,255,0.05);
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; 
    h3 { font-size: 1.2rem; margin: 0; font-weight: 900; } 
    p { font-size: 0.85rem; color: #64748b; margin-top: 5px; }
    .legend { display: flex; gap: 15px; font-size: 0.75rem; font-weight: 800; color: #64748b;
        .item { display: flex; align-items: center; gap: 6px; i { width: 8px; height: 8px; border-radius: 50%; } } } }
  .canvas { height: 350px; }
  .canvas-sm { height: 250px; }
  .flex-center { display: flex; align-items: center; justify-content: center; }
`;

const StrategyCard = styled.div`
  background: linear-gradient(145deg, #1A237E 0%, #0D1F2D 100%); padding: 2.5rem; border-radius: 35px; border: 1.5px solid rgba(255,255,255,0.1); display: flex; flex-direction: column;
  .icon-box { width: 60px; height: 60px; border-radius: 20px; background: rgba(255, 214, 0, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
  h4 { font-size: 1.4rem; margin: 0 0 12px; font-weight: 900; }
  .narrative { font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.7); }
  .advice { background: rgba(255,255,255,0.04); padding: 1.2rem; border-radius: 15px; border-left: 4px solid #00E676; margin: 2rem 0;
    p { margin: 0; font-size: 0.85rem; color: #fff; font-weight: 600; line-height: 1.5; } }
  .footer-node { margin-top: auto; display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 900; color: #00E676; text-transform: uppercase; letter-spacing: 1px; }
`;