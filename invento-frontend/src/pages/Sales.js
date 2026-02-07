import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, BarChart2, List, Search, ChevronLeft, ChevronRight, 
  Loader, DollarSign, TrendingUp, Printer, ArrowUpRight, 
  Database, Radio, ShoppingBag, CreditCard, Trash2, Eye, Edit2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import api from '../api/axios';
import SaleModal from '../components/Sales/SaleModal';
import ReceiptModal from '../components/Sales/ReceiptModal';

export default function Sales() {
  // --- STATE ---
  const [view, setView] = useState('transactions'); 
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [viewScope, setViewScope] = useState('MONTH'); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [realData, setRealData] = useState({ transactions: [], totalRevenue: 0, totalProfit: 0, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- 1. INTELLIGENT DATA ENGINE ---
  const data = useMemo(() => {
    // --- A. SIMULATION MODE ---
    if (isDemoMode) {
        const isYearly = viewScope === 'YEAR';
        const points = isYearly ? 12 : 30;
        const seed = selectedYear + selectedMonth; 

        const simChart = Array.from({ length: points }).map((_, i) => ({
            label: isYearly ? monthNames[i] : `Day ${i + 1}`,
            revenue: 50000 + (Math.sin(i + seed) * 20000) + Math.random() * 10000,
            profit: 20000 + (Math.sin(i + seed) * 8000) + Math.random() * 5000,
        }));

        return {
            revenue: simChart.reduce((a, b) => a + b.revenue, 0),
            profit: simChart.reduce((a, b) => a + b.profit, 0),
            count: 12,
            avgOrder: 4500,
            chartData: simChart,
            pieData: [{ name: 'Profit', value: 30, color: '#00E676' }, { name: 'Cost', value: 70, color: '#00B0FF' }],
            transactions: Array.from({ length: 12 }).map((_, i) => ({
                _id: `SIM-${i+100}`,
                createdAt: new Date().toISOString(),
                sellerId: { name: 'Demo User' },
                lineItems: [{ name: 'Simulated Item', quantity: 1, soldPrice: 5000 }],
                financials: { totalRevenue: 5000, netProfit: 1500 }
            }))
        };
    }

    // --- B. LIVE MODE ---
    const txs = realData?.transactions || [];
    const totalRev = realData?.totalRevenue || 0;
    const chart = (realData?.chartData || []).map(d => ({
        label: d.label || d.date,
        revenue: d.revenue || 0,
        profit: d.profit || 0
    }));

    return {
        revenue: totalRev,
        profit: realData?.totalProfit || 0,
        count: txs.length,
        avgOrder: txs.length > 0 ? (totalRev / txs.length) : 0,
        chartData: chart,
        pieData: [
            { name: 'Revenue', value: totalRev, color: '#00B0FF' },
            { name: 'Profit', value: realData?.totalProfit || 0, color: '#00E676' }
        ],
        transactions: txs
    };
  }, [isDemoMode, realData, viewScope, selectedYear, selectedMonth]);

  // --- 2. DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    try {
      const res = await api.get('/sales/report', { 
        params: { scope: viewScope, year: selectedYear, month: selectedMonth } 
      });
      if (res.data) setRealData(res.data);
    } catch (e) { 
        console.warn("Live sync failed."); 
    } finally { 
        setLoading(false); 
    }
  }, [isDemoMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 3. ACTIONS ---
  const handleDelete = async (id) => {
    if (isDemoMode) return;
    if (!window.confirm("Permanently delete transaction?")) return;
    try { await api.delete(`/sales/${id}`); fetchData(); } catch (e) { alert("Failed"); }
  };

  const filteredTransactions = (data.transactions || []).filter(t => 
    t._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.sellerId?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const paginated = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* --- HEADER --- */}
      <HeaderSection className="no-print">
        <div className="title-group">
          <div className="live-pill" onClick={() => setIsDemoMode(!isDemoMode)}>
            <div className={`dot ${isDemoMode ? 'sim' : 'live'}`} />
            <span>{isDemoMode ? 'SIMULATION' : 'LIVE SYSTEM'}</span>
            <Radio size={12} className={!isDemoMode ? 'pulse' : ''}/>
          </div>
          <h1>Sales <span>Ledger</span></h1>
        </div>
        
        <div className="actions-right">
           <button className="icon-btn" onClick={() => window.print()} title="Print Report">
              <Printer size={18}/>
           </button>
           <button className="add-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={20}/> <span>New Sale</span>
           </button>
        </div>
      </HeaderSection>

      {/* --- KPI GRID --- */}
      <StatsGrid className="no-print">
        <Card $glow="rgba(0, 176, 255, 0.15)">
            <div className="icon-box"><DollarSign size={20} color="#00B0FF"/></div>
            <div className="info">
                <label>Total Revenue</label>
                <h2>Rwf {(data.revenue || 0).toLocaleString()}</h2>
            </div>
        </Card>
        <Card $glow="rgba(0, 230, 118, 0.15)">
            <div className="icon-box"><TrendingUp size={20} color="#00E676"/></div>
            <div className="info">
                <label>Net Profit</label>
                <h2>Rwf {(data.profit || 0).toLocaleString()}</h2>
            </div>
        </Card>
        <Card $glow="rgba(136, 90, 248, 0.15)">
            <div className="icon-box"><ShoppingBag size={20} color="#885AF8"/></div>
            <div className="info">
                <label>Sales Volume</label>
                <h2>{data.count || 0} <small>Txns</small></h2>
            </div>
        </Card>
        <Card $glow="rgba(255, 145, 0, 0.15)">
            <div className="icon-box"><CreditCard size={20} color="#FF9100"/></div>
            <div className="info">
                <label>Avg Order</label>
                <h2>Rwf {Math.floor(data.avgOrder || 0).toLocaleString()}</h2>
            </div>
        </Card>
      </StatsGrid>

      {/* --- FILTER BAR --- */}
      <FilterBar className="no-print">
        <div className="tabs">
            <Tab $active={view==='transactions'} onClick={()=>setView('transactions')}><List size={14}/> Ledger</Tab>
            <Tab $active={view==='analytics'} onClick={()=>setView('analytics')}><BarChart2 size={14}/> Analytics</Tab>
        </div>
        
        <div className="controls">
            <div className="search-wrap">
                <Search size={16}/>
                <input placeholder="Search Ref..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="glass-selects">
                <div className="scope-toggle">
                    <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Mo</button>
                    <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Yr</button>
                </div>
                <div className="divider"/>
                <select value={selectedYear} onChange={(e)=>setSelectedYear(Number(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {viewScope === 'MONTH' && (
                    <select value={selectedMonth} onChange={(e)=>setSelectedMonth(Number(e.target.value))}>
                        {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                    </select>
                )}
            </div>
        </div>
      </FilterBar>

      {/* --- DATA VIEWPORT --- */}
      <AnimatePresence mode="wait">
        {view === 'transactions' ? (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HybridViewport>
              <table className="desktop-table">
                <thead>
                  <tr>
                    <th>Date & Ref</th>
                    <th>Items Summary</th>
                    <th align="right">Revenue</th>
                    <th align="right">Profit</th>
                    <th align="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" align="center" style={{padding: '60px'}}><Loader className="spin" color="#00B0FF"/></td></tr>
                  ) : paginated.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div className="date">{new Date(t.committedAt || t.createdAt).toLocaleDateString()}</div>
                        <code className="ref">#{t._id.slice(-6).toUpperCase()}</code>
                      </td>
                      <td>
                        <div className="item-pills">
                          {/* Use optional chaining on lineItems */}
                          {(t.lineItems || t.items || []).slice(0, 2).map((li, i) => (
                            <span key={i}>{li.name} x{li.quantity}</span>
                          ))}
                        </div>
                      </td>
                      <td align="right"><strong>{(t.financials?.totalRevenue || t.totalRevenue || 0).toLocaleString()}</strong></td>
                      <td align="right" className="profit"><strong>{(t.financials?.netProfit || t.netProfit || 0).toLocaleString()}</strong></td>
                      <td align="right">
                        <button onClick={()=>handleDelete(t._id)} className="del-btn"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mobile-view">
                 {paginated.map(t => (
                   <div className="m-card" key={t._id}>
                      <div className="c-head">
                         <strong>{new Date(t.committedAt || t.createdAt).toLocaleDateString()}</strong>
                         <code className="c-ref">#{t._id.slice(-6).toUpperCase()}</code>
                      </div>
                      <div className="c-body">
                         <div className="c-row"><span>Rev</span><strong>{(t.financials?.totalRevenue || 0).toLocaleString()}</strong></div>
                         <div className="c-row"><span>Net</span><strong className="profit">{(t.financials?.netProfit || 0).toLocaleString()}</strong></div>
                      </div>
                      <button className="del-btn-mob" onClick={()=>handleDelete(t._id)}>Remove</button>
                   </div>
                 ))}
              </div>
            </HybridViewport>
            
            <Pagination className="no-print">
               <span>Page {currentPage} of {totalPages}</span>
               <div className="nav">
                 <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><ChevronLeft/></button>
                 <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}><ChevronRight/></button>
               </div>
            </Pagination>
          </motion.div>
        ) : (
          <AnalyticsLayout key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="chart-box main">
                <h3>Revenue Waterfall</h3>
                <div style={{height: 320, marginTop: '1rem'}}>
                  <ResponsiveContainer>
                    <ComposedChart data={data.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="label" tick={{fill:'#64748b', fontSize: 10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#0D1F2D', border:'none', borderRadius:'12px'}}/>
                      <Area type="monotone" dataKey="revenue" stroke="#00B0FF" strokeWidth={3} fillOpacity={0.1} fill="#00B0FF"/>
                      <Line type="monotone" dataKey="profit" stroke="#00E676" strokeWidth={3} dot={{r:3}}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
             </div>
             
             <div className="chart-box side">
                <h3>Structure</h3>
                <div style={{height: 200}}>
                  <ResponsiveContainer>
                    <RePieChart>
                      <Pie data={data.pieData || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {(data.pieData || []).map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="legend">
                   {(data.pieData || []).map((p, i) => (
                     <div key={i} className="l-item"><span style={{background: p.color}}/> {p.name}</div>
                   ))}
                </div>
             </div>
          </AnalyticsLayout>
        )}
      </AnimatePresence>

      {/* PRINT SECTION */}
      <PrintContainer id="print-report">
          <h1>INVENTO SALES SUMMARY</h1>
          <p>Scope: {viewScope} - {selectedYear}</p>
          <table>
              <thead><tr><th>Date</th><th>Revenue</th><th>Profit</th></tr></thead>
              <tbody>
                  {filteredTransactions.map(t => (
                      <tr key={t._id}>
                          <td>{new Date(t.committedAt).toLocaleDateString()}</td>
                          <td>{t.financials?.totalRevenue}</td>
                          <td>{t.financials?.netProfit}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </PrintContainer>

      {isModalOpen && <SaleModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchData(); }} />}
      {completedSale && <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />}

      <style>{`
        @media screen { #print-report { display: none; } }
        @media print {
            body * { visibility: hidden; }
            #print-report, #print-report * { visibility: visible; }
            #print-report { position: absolute; left: 0; top: 0; width: 100%; color: black; background: white; padding: 40px; }
            .no-print { display: none !important; }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </PageWrapper>
  );
}

// --- STYLES ---

const PageWrapper = styled(motion.div)`
  max-width: 1400px; margin: 0 auto; padding: 1rem; color: #fff; background: #04080F; min-height: 100vh;
  @media (min-width: 768px) { padding: 2rem; }
`;

const HeaderSection = styled.header`
  display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;
  @media (min-width: 768px) { flex-direction: row; justify-content: space-between; align-items: flex-end; }
  .title-group {
    .live-pill { display: inline-flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 20px;
      .dot { width: 6px; height: 6px; border-radius: 50%; &.live { background: #00E676; box-shadow: 0 0 10px #00E676; } &.sim { background: #FF9100; } } .pulse { animation: blink 1.5s infinite; } }
    h1 { font-size: 2rem; margin: 5px 0 0; font-weight: 900; letter-spacing: -1px; span { color: #00B0FF; } } }
  .actions-right { display: flex; gap: 10px; }
  .icon-btn { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); width: 44px; height: 44px; border-radius: 12px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .add-btn { background: #00B0FF; color: white; border: none; padding: 0 24px; height: 44px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; }
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;
`;

const Card = styled.div`
  background: rgba(13,31,45,0.3); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1.5rem;
  .icon-box { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
  .info { label { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; } h2 { margin: 2px 0 0 0; font-size: 1.4rem; font-weight: 900; } }
`;

const FilterBar = styled.div`
  display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;
  @media (min-width: 1024px) { flex-direction: row; justify-content: space-between; align-items: center; }
  .tabs { display: flex; background: #0D1F2D; padding: 4px; border-radius: 12px; gap: 4px; }
  .controls { display: flex; flex-direction: column; gap: 10px; width: 100%; @media (min-width: 600px) { flex-direction: row; } @media (min-width: 1024px) { width: auto; }
    .search-wrap { flex: 1; background: #0D1F2D; padding: 0 1rem; border-radius: 12px; display: flex; align-items: center; height: 44px; color: #64748b; border: 1px solid rgba(255,255,255,0.05);
      input { background: none; border: none; padding-left: 10px; color: white; width: 100%; outline: none; } }
    .glass-selects { display: flex; align-items: center; gap: 10px; background: #0D1F2D; padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
        .scope-toggle { display: flex; button { border: none; background: none; color: #64748b; padding: 6px 12px; font-weight: 800; font-size: 0.7rem; cursor: pointer; &.active { background: white; color: black; border-radius: 8px; } } }
        .divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
        select { background: none; border: none; color: white; font-weight: 700; outline: none; cursor: pointer; font-size: 0.8rem; } } }
`;

const Tab = styled.button`
  background: ${p => p.$active ? '#00B0FF' : 'transparent'}; color: ${p => p.$active ? 'white' : '#64748b'};
  border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
`;

const HybridViewport = styled.div`
  background: rgba(13,31,45,0.4); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
  .desktop-table { width: 100%; border-collapse: collapse; display: none; @media (min-width: 1100px) { display: table; }
    th { text-align: left; padding: 1.2rem; color: #64748b; font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
    td { padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.03); 
      .item-pills span { display: inline-block; background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; margin-right: 6px; color: #94a3b8; }
      .profit { color: #00E676; } 
      .del-btn { background: none; border: none; color: #f43f5e; cursor: pointer; } } }
  .mobile-view { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; @media (min-width: 1100px) { display: none; }
    .m-card { background: #0D1F2D; padding: 1.2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
      .c-head { display: flex; justify-content: space-between; margin-bottom: 1rem; }
      .c-body { margin-bottom: 1rem; .c-row { display: flex; justify-content: space-between; margin-bottom: 5px; } .profit { color: #00E676; } }
      .del-btn-mob { width: 100%; padding: 10px; background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: none; border-radius: 10px; font-weight: 700; } } }
  .empty-state { padding: 4rem; text-align: center; color: #475569; font-weight: 800; }
`;

const AnalyticsLayout = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 1.5rem; @media (min-width: 1024px) { grid-template-columns: 1fr 350px; }
  .chart-box { background: rgba(13,31,45,0.4); padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); 
    .legend { display: flex; gap: 10px; font-size: 0.7rem; .dot { width: 8px; height: 8px; border-radius: 50%; } } }
  .legend-list { margin-top: 1rem; .l-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; span { width: 10px; height: 10px; border-radius: 2px; } } }
`;

const Pagination = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem;
  .nav { display: flex; gap: 10px; button { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 8px; cursor: pointer; &:disabled { opacity: 0.3; } } }
`;

const PrintContainer = styled.div` padding: 40px; table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } `;