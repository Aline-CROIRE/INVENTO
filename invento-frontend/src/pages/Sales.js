import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, BarChart3, List, Search, ChevronLeft, ChevronRight, 
  Loader, DollarSign, TrendingUp, Printer, Radio, ShoppingBag, 
  Trash2, Receipt, RefreshCcw, Calendar, Filter, Download, ArrowUpRight, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend
} from 'recharts';
import api from '../api/axios';
import SaleModal from '../components/Sales/SaleModal';

// --- HELPER: Money Shortener (e.g. 1.5M, 20k) ---
const formatShort = (num) => {
    if (!num && num !== 0) return "0";
    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (absNum >= 1000000) return sign + (absNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (absNum >= 1000) return sign + (absNum / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return sign + absNum.toString();
};

const CHART_COLORS = ['#00B0FF', '#f43f5e', '#00E676', '#fbbf24', '#885AF8'];

export default function Sales() {
  const navigate = useNavigate();
  const [view, setView] = useState('ledger'); 
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [viewScope, setViewScope] = useState('MONTH'); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [realData, setRealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  }, []);

  const fetchData = useCallback(async () => {
    if (isAnalysisMode) return;
    setLoading(true);
    try {
      const res = await api.get('/sales/report', { params: { scope: viewScope, year: selectedYear, month: selectedMonth } });
      setRealData(res.data);
    } catch (e) { console.warn("Sync failed"); }
    finally { setLoading(false); }
  }, [isAnalysisMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- DATA PROCESSING ---
  const data = useMemo(() => {
    if (isAnalysisMode) {
        return {
            revenue: 3500000, opEx: 850000, profit: 1650000, count: 64,
            chartData: Array.from({ length: 12 }).map((_, i) => ({ label: monthNames[i], revenue: 100000 + (Math.random()*20000), profit: 50000 })),
            pieData: [{ name: 'Retail', value: 2400000 }, { name: 'Wholesale', value: 1100000 }],
            transactions: []
        };
    }
    const txs = realData?.transactions || [];
    const summary = realData?.summary || {};
    const catData = (realData?.categoryData || []).map(c => ({ name: c.name, value: c.revenue }));
    
    return {
        revenue: summary.totalRevenue || 0,
        opEx: realData?.totalOperatingExpenses || 0,
        profit: realData?.totalProfit || 0,
        count: txs.length,
        chartData: (realData?.chartData || []).map(d => ({ label: d.label, revenue: d.revenue, profit: d.profit })),
        pieData: catData.length > 0 ? catData : [{name: 'No Sales', value: 1}],
        transactions: txs
    };
  }, [isAnalysisMode, realData]);

  const filtered = data.transactions.filter(t => t._id.toLowerCase().includes(searchQuery.toLowerCase()));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* 1. HEADER (HIDDEN ON PRINT) */}
      <HeaderSection className="no-print">
        <div className="branding">
          <div className="mode-pill" onClick={() => setIsAnalysisMode(!isAnalysisMode)}>
            <Radio size={12} color={isAnalysisMode ? "#fbbf24" : "#10b981"} />
            <span>{isAnalysisMode ? 'ANALYSIS MODE' : 'LIVE PRODUCTION'}</span>
          </div>
          <h1>Sales <span>Ledger</span></h1>
        </div>
        
        <div className="top-actions">
           <button className="icon-btn" onClick={() => window.print()} title="Print Business Report"><Printer size={18}/></button>
           <button className="add-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={20}/> <span>Record Sale</span>
           </button>
        </div>
      </HeaderSection>

      {/* 2. STATS GRID (HIDDEN ON PRINT) */}
      <StatsGrid className="no-print">
        <StatCard $glow="#00B0FF">
            <label>Money In (Revenue)</label>
            <h3>Rwf {formatShort(data.revenue)}</h3>
            <div className="chart-line blue" />
        </StatCard>
        <StatCard $glow="#f43f5e">
            <label>Money Out (Bills)</label>
            <h3>Rwf {formatShort(data.opEx)}</h3>
            <div className="chart-line red" />
        </StatCard>
        <StatCard $glow="#00E676">
            <label>Actual Earnings</label>
            <h3>Rwf {formatShort(data.profit)}</h3>
            <div className="chart-line green" />
        </StatCard>
        <StatCard $glow="#885AF8">
            <label>Sales Count</label>
            <h3>{data.count} <small>Txns</small></h3>
            <div className="chart-line purple" />
        </StatCard>
      </StatsGrid>

      {/* 3. CONTROL DECK (HIDDEN ON PRINT) */}
      <FilterBar className="no-print">
        <div className="view-selector">
            <button className={view === 'ledger' ? 'active' : ''} onClick={()=>setView('ledger')}><List size={16}/> Transactions</button>
            <button className={view === 'analytics' ? 'active' : ''} onClick={()=>setView('analytics')}><BarChart3 size={16}/> Intelligence</button>
        </div>
        
        <div className="right-tools">
            <div className="search-box">
                <Search size={18}/>
                <input placeholder="Search ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            
            <ControlGlass>
                <div className="scope">
                    <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Mo</button>
                    <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Yr</button>
                </div>
                <div className="picker">
                    <Calendar size={14}/>
                    <select value={selectedYear} onChange={(e)=>setSelectedYear(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                {viewScope === 'MONTH' && (
                    <div className="picker">
                        <Filter size={14}/>
                        <select value={selectedMonth} onChange={(e)=>setSelectedMonth(Number(e.target.value))}>
                            {monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                        </select>
                    </div>
                )}
                <button className={`sync ${loading ? 'spin' : ''}`} onClick={fetchData}><RefreshCcw size={16}/></button>
            </ControlGlass>
        </div>
      </FilterBar>

      {/* 4. MAIN CONTENT (HIDDEN ON PRINT) */}
      <div className="no-print">
        <AnimatePresence mode="wait">
            {view === 'ledger' ? (
              <motion.div key="ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <TableCard>
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Reference</th>
                        <th>Inventory Items</th>
                        <th align="right">Revenue</th>
                        <th align="right">Net Profit</th>
                        <th align="right">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" align="center" style={{padding: '80px'}}><Loader className="spin" color="#00B0FF" size={40}/></td></tr>
                      ) : paginated.map(t => (
                        <tr key={t._id}>
                          <td className="id-cell">
                            <strong>{new Date(t.committedAt || t.createdAt).toLocaleDateString()}</strong>
                            <span>#{t._id.slice(-6).toUpperCase()}</span>
                          </td>
                          <td>
                            <div className="item-pills">
                              {(t.lineItems || []).slice(0, 1).map((li, i) => <span key={i}>{li.name} x{li.quantity}</span>)}
                              {t.lineItems?.length > 1 && <small>+{t.lineItems.length - 1} more</small>}
                            </div>
                          </td>
                          <td align="right"><strong>{(t.financials?.totalRevenue || 0).toLocaleString()}</strong></td>
                          <td align="right" className="profit-txt">Rwf {(t.financials?.grossProfit || 0).toLocaleString()}</td>
                          <td align="right">
                            <button className="del-row" onClick={() => { if(window.confirm("Purge?")) api.delete(`/sales/${t._id}`).then(fetchData)}}><Trash2 size={15}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableCard>
                <Pagination>
                   <p>Showing {paginated.length} of {filtered.length} entries</p>
                   <div className="btns">
                     <button disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button>
                     <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button>
                   </div>
                </Pagination>
              </motion.div>
            ) : (
              <AnalyticsContainer key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                 <div className="grid-card main">
                    <div className="card-head">
                        <h3>Revenue Waterfall</h3>
                        <div className="legend"><span className="blue"/> Revenue <span className="green"/> Net Profit</div>
                    </div>
                    <div className="canvas-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                          <XAxis dataKey="label" tick={{fill:'#64748b', fontSize: 10}} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{background:'#0D1F2D', border:'none', borderRadius:'12px'}}/>
                          <Area type="monotone" dataKey="revenue" stroke="#00B0FF" strokeWidth={3} fillOpacity={0.1} fill="#00B0FF"/>
                          <Line type="monotone" dataKey="profit" stroke="#00E676" strokeWidth={3} dot={{r:4, fill:'#00E676'}}/>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 
                 <div className="grid-card side">
                    <div className="card-head"><h3>Category Sales</h3></div>
                    <div className="pie-canvas">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie 
                            data={data.pieData} 
                            innerRadius={60} 
                            outerRadius={85} 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                          >
                            {data.pieData.map((e,i)=><Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip formatter={(v) => `Rwf ${v.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="legend-list">
                       {data.pieData.slice(0, 4).map((p, i) => (
                         <div key={i} className="l-item">
                            <span style={{background: CHART_COLORS[i % CHART_COLORS.length]}}/> 
                            <label>{p.name}</label>
                         </div>
                       ))}
                    </div>
                    <button className="full-link" onClick={() => navigate('/inventory')}>Full Inventory Stats <ArrowUpRight size={14}/></button>
                 </div>
              </AnalyticsContainer>
            )}
        </AnimatePresence>
      </div>

      {/* --- 5. THE PROFESSIONAL PRINT PORTAL (VISIBLE ONLY ON PRINT) --- */}
      <PrintDocument id="business-report">
          <div className="report-header">
             <div className="brand-side">
                <h1>INVENTO IMS</h1>
                <p>Official Financial Performance Report</p>
             </div>
             <div className="meta-side">
                <p><strong>Period:</strong> {monthNames[selectedMonth-1]} {selectedYear}</p>
                <p><strong>Printed:</strong> {new Date().toLocaleString()}</p>
             </div>
          </div>

          <div className="report-summary">
              <div className="box"><span>TOTAL REVENUE</span><strong>Rwf {data.revenue.toLocaleString()}</strong></div>
              <div className="box"><span>TOTAL EXPENSES</span><strong>Rwf {data.opEx.toLocaleString()}</strong></div>
              <div className="box"><span>ACTUAL EARNINGS</span><strong>Rwf {data.profit.toLocaleString()}</strong></div>
          </div>

          <table className="report-table">
              <thead>
                  <tr>
                    <th>DATE</th>
                    <th>REFERENCE</th>
                    <th>PRODUCT SUMMARY</th>
                    <th align="right">REVENUE</th>
                    <th align="right">NET PROFIT</th>
                  </tr>
              </thead>
              <tbody>
                  {filtered.map(t => (
                      <tr key={t._id}>
                          <td>{new Date(t.committedAt).toLocaleDateString()}</td>
                          <td>#{t._id.slice(-6).toUpperCase()}</td>
                          <td>{(t.lineItems || []).map(l => l.name).join(", ")}</td>
                          <td align="right">{t.financials?.totalRevenue.toLocaleString()}</td>
                          <td align="right">{t.financials?.grossProfit.toLocaleString()}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          <div className="report-footer">
             <p>This document is a verified system record of Invento IMS Business Intelligence. Page 1 of 1</p>
             <div className="seal">System Verified Record</div>
          </div>
      </PrintDocument>

      {isModalOpen && <SaleModal onClose={() => setIsModalOpen(false)} onSuccess={() => fetchData()} />}

      <style>{`
        @media screen { #business-report { display: none; } }
        @media print {
            /* 1. Global Reset */
            @page { size: A4 portrait; margin: 0; }
            body, html { background: white !important; color: black !important; margin: 0; padding: 0; width: 100%; height: 100%; }
            
            /* 2. Hide Web UI */
            .no-print, .sidebar, .TopBarWrapper, nav, header, aside, [class*="Sidebar"], [class*="TopBar"] { 
                display: none !important; opacity: 0 !important; visibility: hidden !important; width: 0 !important; height: 0 !important;
            }

            /* 3. Show Document UI */
            #business-report { 
                display: block !important; position: absolute; left: 0; top: 0; width: 100%; 
                padding: 50px; background: white; z-index: 99999;
            }

            .report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 5px solid black; padding-bottom: 20px; margin-bottom: 40px; }
            .brand-side h1 { font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -2px; }
            .brand-side p { margin: 0; font-size: 14px; font-weight: 700; color: #555; }
            .meta-side { text-align: right; font-size: 12px; font-weight: 600; }

            .report-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 50px; }
            .report-summary .box { padding: 25px; border: 2px solid black; background: #f9f9f9; }
            .report-summary .box span { display: block; font-size: 10px; font-weight: 900; margin-bottom: 10px; color: #444; }
            .report-summary .box strong { font-size: 20px; font-weight: 900; }

            .report-table { width: 100%; border-collapse: collapse; }
            .report-table th { text-align: left; padding: 12px; background: #eee; border: 1px solid black; font-size: 11px; font-weight: 900; }
            .report-table td { padding: 12px; border: 1px solid #ddd; font-size: 11px; font-weight: 600; }

            .report-footer { margin-top: 80px; border-top: 1px solid black; padding-top: 30px; text-align: center; }
            .report-footer p { font-size: 10px; font-weight: 700; color: #666; }
            .seal { display: inline-block; margin-top: 20px; border: 3px double black; padding: 10px 20px; font-weight: 900; text-transform: uppercase; font-size: 12px; transform: rotate(-5deg); }
        }
      `}</style>
    </PageWrapper>
  );
}

// --- STYLED COMPONENTS ---

const PageWrapper = styled(motion.div)` padding: 2rem; max-width: 1550px; margin: 0 auto; min-height: 100vh; background: #020617; color: #fff; font-family: 'Inter', sans-serif; `;

const HeaderSection = styled.header` display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; flex-wrap: wrap; gap: 20px;
  .branding { h1 { font-size: 2.6rem; margin: 0; font-weight: 900; letter-spacing: -2px; span { color: #00B0FF; } }
    .mode-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 15px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; span { font-size: 0.65rem; font-weight: 900; color: #94a3b8; letter-spacing: 1px; } } }
  .top-actions { display: flex; gap: 15px; .icon-btn { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); width: 52px; height: 52px; border-radius: 16px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { color: #fff; border-color: #fff; } }
    .add-btn { background: #00B0FF; color: white; border: none; padding: 0 28px; height: 52px; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0, 176, 255, 0.4); } } } `;

const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; `;
const StatCard = styled.div` background: #0f172a; padding: 2rem; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;
  label { font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; } h3 { margin: 12px 0 0; font-size: 1.8rem; font-weight: 900; small { font-size: 0.9rem; color: #475569; } }
  .chart-line { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; opacity: 0.6; &.blue { background: #00B0FF; } &.red { background: #f43f5e; } &.green { background: #00E676; } &.purple { background: #885AF8; } } `;

const FilterBar = styled.div` display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; @media (min-width: 1200px) { flex-direction: row; justify-content: space-between; align-items: center; }
  .view-selector { display: flex; background: #0f172a; padding: 6px; border-radius: 18px; gap: 6px; border: 1px solid rgba(255,255,255,0.05);
    button { background: none; border: none; color: #64748b; padding: 10px 25px; border-radius: 14px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; &.active { background: #00B0FF; color: white; box-shadow: 0 5px 15px rgba(0, 176, 255, 0.2); } } }
  .right-tools { display: flex; flex-wrap: wrap; gap: 15px; .search-box { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); padding: 0 20px; border-radius: 16px; display: flex; align-items: center; gap: 12px; color: #64748b; input { background: none; border: none; color: white; padding: 14px 0; outline: none; font-weight: 600; width: 220px; } } } `;

const ControlGlass = styled.div` display: flex; align-items: center; gap: 12px; background: #000; padding: 6px 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1);
  .scope { display: flex; gap: 4px; padding-right: 15px; border-right: 1px solid rgba(255,255,255,0.1); button { background: none; border: none; color: #64748b; padding: 8px 14px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; cursor: pointer; &.active { background: #fff; color: #000; } } }
  .picker { display: flex; align-items: center; gap: 8px; color: #64748b; select { background: #000 !important; border: none; color: #fff; font-weight: 800; outline: none; cursor: pointer; padding: 8px 0; font-size: 0.85rem; option { background: #000; color: #fff; } } }
  .sync { background: none; border: none; color: #64748b; cursor: pointer; &.spin { animation: spin 1s linear infinite; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `;

const TableCard = styled.div` background: #0f172a; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
  table { width: 100%; border-collapse: collapse; th { text-align: left; padding: 1.5rem; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 900; border-bottom: 1px solid rgba(255,255,255,0.05); } 
    td { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); .tiny { display: block; font-size: 0.7rem; color: #475569; margin-top: 4px; } .item-pills span { background: rgba(255,255,255,0.04); padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; margin-right: 10px; color: #94a3b8; font-weight: 700; } .profit-txt { color: #00E676; font-weight: 800; } .del-row { background: none; border: none; color: #f43f5e; cursor: pointer; opacity: 0.4; &:hover { opacity: 1; } } } } `;

const AnalyticsContainer = styled(motion.div)` display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem;
    .grid-card { background: #0f172a; padding: 2.5rem; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); &.main { grid-column: span 8; } &.side { grid-column: span 4; } 
    .card-head { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.1rem; margin:0; font-weight: 800; color: #94a3b8; }
      .legend { display: flex; gap: 15px; font-size: 0.75rem; span { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; &.blue { background: #00B0FF; } &.green { background: #00E676; } } } } }
    .pie-canvas { margin-top: 2rem; display: flex; justify-content: center; }
    .legend-list { margin-top: 1.5rem; .l-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 0.85rem; span { width: 10px; height: 10px; border-radius: 2px; } } }
    .full-link { width: 100%; background: rgba(0, 176, 255, 0.05); color: #00B0FF; border: 1px dashed rgba(0, 176, 255, 0.3); padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; margin-top: 2rem; display: flex; align-items: center; justify-content: center; gap: 10px; } `;

const Pagination = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; color: #475569; font-size: 0.9rem; .btns { display: flex; gap: 10px; button { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 10px; cursor: pointer; &:disabled { opacity: 0.3; } } } `;

const PrintDocument = styled.div``;