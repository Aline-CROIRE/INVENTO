import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Plus, Search, ChevronLeft, ChevronRight, 
  Loader, DollarSign, Trash2, CreditCard, Radio, 
  BarChart3, RefreshCcw, Calendar, CheckCircle, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../api/axios';

export default function Expenses() {
  // --- STATE ---
  const [viewScope, setViewScope] = useState('MONTH');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [realData, setRealData] = useState({ expenses: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    title: '', amount: '', category: 'Rent', paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], status: 'PAID' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['Rent', 'Salary', 'Utilities', 'Marketing', 'Logistics', 'Maintenance', 'Stock Purchase', 'Other'];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- 1. DATA ENGINE (Live vs Demo) ---
  const data = useMemo(() => {
    if (isDemoMode) {
      const isYearly = viewScope === 'YEAR';
      const simExpenses = Array.from({ length: 15 }).map((_, i) => {
        const cats = ['Rent', 'Salary', 'Utilities', 'Marketing'];
        const cat = cats[i % cats.length];
        const amt = (i * 15000) + 20000;
        return {
          _id: `SIM-${i}`,
          title: `Simulated ${cat} Expense`,
          amount: amt,
          category: cat,
          date: new Date().toISOString(),
          paymentMethod: i % 2 === 0 ? 'Bank Transfer' : 'Mobile Money',
          status: i % 4 === 0 ? 'PENDING' : 'PAID'
        };
      });

      const total = simExpenses.reduce((a, b) => a + b.amount, 0);
      
      return {
        expenses: simExpenses,
        totalAmount: total,
        count: simExpenses.length,
        avgExpense: total / simExpenses.length,
        catData: [
          { name: 'Rent', value: 250000, color: '#f43f5e' },
          { name: 'Salary', value: 450000, color: '#00B0FF' },
          { name: 'Marketing', value: 120000, color: '#885AF8' },
          { name: 'Utilities', value: 80000, color: '#FFB300' }
        ]
      };
    }

    // LIVE DATA MAPPING
    const expList = realData?.expenses || [];
    const total = realData?.totalAmount || 0;
    
    // Group by category for pie chart
    const catMap = {};
    expList.forEach(e => {
      if (!catMap[e.category]) catMap[e.category] = 0;
      catMap[e.category] += e.amount;
    });

    const colors = ['#f43f5e', '#00B0FF', '#885AF8', '#FFB300', '#00E676', '#FF9100'];
    const catData = Object.keys(catMap).map((k, i) => ({
      name: k, value: catMap[k], color: colors[i % colors.length]
    })).sort((a,b) => b.value - a.value);

    return {
      expenses: expList,
      totalAmount: total,
      count: expList.length,
      avgExpense: expList.length > 0 ? total / expList.length : 0,
      catData
    };
  }, [isDemoMode, realData, viewScope, selectedYear, selectedMonth]);

  // --- 2. FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    try {
      const res = await api.get('/expenses', { 
        params: { month: viewScope === 'MONTH' ? selectedMonth : undefined, year: selectedYear } 
      });
      setRealData(res.data);
    } catch (e) {
      console.warn("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 3. ACTIONS ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/expenses', newExpense);
      setIsModalOpen(false);
      setNewExpense({ title: '', amount: '', category: 'Rent', paymentMethod: 'Cash', date: new Date().toISOString().split('T')[0], status: 'PAID' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (isDemoMode) return;
    if (!window.confirm("Permanently delete this expense? This will recalculate Net Profit for this period.")) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (e) { alert("Failed to delete"); }
  };

  const filtered = data.expenses.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  // Find top category
  const topCategory = data.catData.length > 0 ? data.catData[0].name : "None";

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HEADER WITH TIME FILTERS */}
      <HeaderSection>
        <div className="branding">
          <div className="mode-selector" onClick={() => setIsDemoMode(!isDemoMode)}>
            <div className={`status-dot ${isDemoMode ? 'sim' : 'live'}`} />
            <span className="mode-label">{isDemoMode ? 'SIMULATION' : 'LIVE SYSTEM'}</span>
            <Radio size={14} className={!isDemoMode ? 'pulse' : ''} />
          </div>
          <h1>Operating <span>Expenses</span></h1>
        </div>

        <div className="action-deck">
          <div className="deck-glass">
            <div className="scope-pills">
              <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Mo</button>
              <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Yr</button>
            </div>
            <div className="divider-v" />
            <div className="pickers">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {viewScope === 'MONTH' && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              )}
            </div>
            <button className={`sync-trigger ${loading ? 'spin' : ''}`} onClick={fetchData} disabled={isDemoMode}>
              <RefreshCcw size={18} />
            </button>
          </div>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={20}/> <span>Log Expense</span>
          </button>
        </div>
      </HeaderSection>

      {/* KPI GRID */}
      <StatsGrid>
        <Card $glow="rgba(244, 63, 94, 0.15)">
            <div className="icon-box"><Receipt size={24} color="#f43f5e"/></div>
            <div className="info">
                <label>Total Period Outflow</label>
                <h2>Rwf {data.totalAmount.toLocaleString()}</h2>
            </div>
        </Card>
        <Card $glow="rgba(0, 176, 255, 0.15)">
            <div className="icon-box"><BarChart3 size={24} color="#00B0FF"/></div>
            <div className="info">
                <label>Highest Cost Center</label>
                <h2>{topCategory}</h2>
            </div>
        </Card>
        <Card $glow="rgba(136, 90, 248, 0.15)">
            <div className="icon-box"><CreditCard size={24} color="#885AF8"/></div>
            <div className="info">
                <label>Recorded Entries</label>
                <h2>{data.count} <small>Receipts</small></h2>
            </div>
        </Card>
        <Card $glow="rgba(255, 179, 0, 0.15)">
            <div className="icon-box"><Calendar size={24} color="#FFB300"/></div>
            <div className="info">
                <label>Average Entry</label>
                <h2>Rwf {Math.floor(data.avgExpense).toLocaleString()}</h2>
            </div>
        </Card>
      </StatsGrid>

      {/* ANALYTICS BENTO GRID */}
      <BentoLayout>
        <div className="span-8 chart-card">
          <div className="card-header">
            <h3>Outflow Breakdown by Category</h3>
          </div>
          <div className="canvas">
             <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.catData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="name" tick={{fill:'#64748b', fontSize: 11}} axisLine={false} tickLine={false}/>
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{background:'#0D1F2D', border:'none', borderRadius:'12px'}}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {data.catData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="span-4 pie-card">
           <div className="card-header">
             <h3>Distribution</h3>
           </div>
           <div className="canvas-sm flex-center">
             <ResponsiveContainer width="100%" height={240}>
               <RePieChart>
                 <Pie data={data.catData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {data.catData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                 </Pie>
                 <Tooltip contentStyle={{background:'#0D1F2D', border:'none', borderRadius:'8px'}}/>
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '11px', color:'#94a3b8'}}/>
               </RePieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </BentoLayout>

      {/* SEARCH AND TABLE */}
      <FilterBar>
        <div className="search-wrap">
            <Search size={16}/>
            <input placeholder="Search expenses by title or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </FilterBar>

      <HybridViewport>
        <table className="desktop-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Detail</th>
              <th>Category & Method</th>
              <th align="right">Amount</th>
              <th align="right">Status</th>
              <th align="right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" align="center" style={{padding: '60px'}}><Loader className="spin" color="#f43f5e"/></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan="6" align="center" style={{padding: '40px', color: '#64748b'}}>No expenses recorded for this period.</td></tr>
            ) : paginated.map(exp => (
              <tr key={exp._id}>
                <td>{new Date(exp.date).toLocaleDateString()}</td>
                <td><strong>{exp.title}</strong></td>
                <td>
                  <span className="cat-pill">{exp.category}</span>
                  <small style={{display:'block', marginTop:'4px', color:'#64748b'}}>{exp.paymentMethod}</small>
                </td>
                <td align="right" style={{color:'#f43f5e', fontWeight:'900', fontSize:'1.1rem'}}>Rwf {exp.amount.toLocaleString()}</td>
                <td align="right">
                  <StatusBadge $status={exp.status}>
                    {exp.status === 'PAID' ? <CheckCircle size={12}/> : <Clock size={12}/>} {exp.status}
                  </StatusBadge>
                </td>
                <td align="right">
                  <button onClick={()=>handleDelete(exp._id)} className="del-btn"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MOBILE CARDS */}
        <div className="mobile-view">
            {paginated.map(exp => (
              <div className="m-card" key={exp._id}>
                  <div className="c-head">
                     <strong>{exp.title}</strong>
                     <StatusBadge $status={exp.status}>{exp.status}</StatusBadge>
                  </div>
                  <div className="c-body">
                     <div className="c-row"><span>Date</span><strong>{new Date(exp.date).toLocaleDateString()}</strong></div>
                     <div className="c-row"><span>Category</span><strong>{exp.category} ({exp.paymentMethod})</strong></div>
                     <div className="c-row"><span>Amount</span><strong style={{color:'#f43f5e', fontSize:'1.1rem'}}>Rwf {exp.amount.toLocaleString()}</strong></div>
                  </div>
                  <button className="del-btn-mob" onClick={()=>handleDelete(exp._id)}>Delete Record</button>
              </div>
            ))}
        </div>
      </HybridViewport>

      <Pagination>
        <span>Page {currentPage} of {totalPages}</span>
        <div className="nav">
          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><ChevronLeft/></button>
          <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}><ChevronRight/></button>
        </div>
      </Pagination>

      {/* ADVANCED EXPENSE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ModalBox initial={{y:50, opacity:0, scale:0.95}} animate={{y:0, opacity:1, scale:1}} exit={{y:20, opacity:0}}>
              <div className="modal-header">
                 <h3>Record Outflow</h3>
                 <p>Log a business expense to deduct from gross profit.</p>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Title / Description</label>
                  <input type="text" required placeholder="e.g. Monthly Warehouse Rent" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} />
                </div>
                
                <div className="split">
                  <div className="form-group">
                    <label>Amount (Rwf)</label>
                    <input type="number" required placeholder="0" min="1" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Record Date</label>
                    {/* Allows backdating for accurate accounting */}
                    <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                  </div>
                </div>

                <div className="split">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select value={newExpense.paymentMethod} onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value})}>
                      <option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={newExpense.status} onChange={e => setNewExpense({...newExpense, status: e.target.value})}>
                    <option value="PAID">PAID (Money has left account)</option>
                    <option value="PENDING">PENDING (Accrued but not paid)</option>
                  </select>
                </div>

                <div className="actions">
                  <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Commit Expense'}</button>
                </div>
              </form>
            </ModalBox>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// --- STYLES ---

const PageWrapper = styled(motion.div)`max-width: 1400px; margin: 0 auto; padding: 1rem; color: #fff; background: #04080F; min-height: 100vh; @media (min-width: 768px) { padding: 2rem; }`;

const HeaderSection = styled.header`
  display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;
  @media (min-width: 1100px) { flex-direction: row; justify-content: space-between; align-items: flex-end; }
  .branding {
    .mode-selector { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); padding: 6px 16px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px;
        .status-dot { width: 8px; height: 8px; border-radius: 50%; &.live { background: #00E676; box-shadow: 0 0 10px #00E676; } &.sim { background: #FFB300; } }
        .mode-label { font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; } }
    h1 { font-size: 2.2rem; margin: 0; font-weight: 900; letter-spacing: -1px; span { color: #f43f5e; } }
  }
  .action-deck { display: flex; gap: 1rem; flex-wrap: wrap; 
    .deck-glass { display: flex; align-items: center; gap: 12px; background: #0D1F2D; padding: 8px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06);
        .scope-pills { display: flex; gap: 4px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 12px;
            button { border: none; background: none; color: #64748b; padding: 8px 16px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s;
                &.active { background: #fff; color: #000; border-radius: 8px; } } }
        .divider-v { width: 1.5px; height: 25px; background: rgba(255,255,255,0.1); }
        .pickers select { background: none; border: none; color: #fff; font-weight: 800; outline: none; cursor: pointer; font-size: 0.85rem; padding: 0 5px; }
        .sync-trigger { background: none; border: none; color: #64748b; cursor: pointer; transition: 0.3s; &.spin { animation: spin 1s linear infinite; } &:hover { color: #fff; } } }
    .add-btn { background: #f43f5e; color: white; border: none; padding: 0 24px; border-radius: 14px; font-weight: 900; height: 50px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(244, 63, 94, 0.3); } } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;`;
const Card = styled.div`
  background: rgba(13,31,45,0.3); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1.5rem;
  .icon-box { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
  .info { label { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; } h2 { margin: 2px 0 0 0; font-size: 1.4rem; font-weight: 900; } }
`;

const BentoLayout = styled.div`
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; margin-bottom: 2.5rem;
  .span-8 { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 8; } }
  .span-4 { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 4; } }
  .chart-card, .pie-card { background: rgba(13,31,45,0.4); padding: 2rem; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); }
  .card-header { margin-bottom: 1.5rem; h3 { font-size: 1.1rem; margin: 0; font-weight: 800; color: #94a3b8; } }
  .flex-center { display: flex; align-items: center; justify-content: center; }
`;

const FilterBar = styled.div`margin-bottom: 1.5rem; .search-wrap { background: #0D1F2D; padding: 0 1rem; border-radius: 12px; display: flex; align-items: center; height: 48px; color: #64748b; border: 1px solid rgba(255,255,255,0.05); max-width: 400px; input { background: none; border: none; padding-left: 10px; color: white; width: 100%; outline: none; } }`;

const HybridViewport = styled.div`
  background: rgba(13,31,45,0.4); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
  .desktop-table { width: 100%; border-collapse: collapse; display: none; @media (min-width: 1024px) { display: table; }
    th { text-align: left; padding: 1.2rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
    td { padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.03); 
      .cat-pill { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: #94a3b8; }
      .del-btn { background: rgba(244, 63, 94, 0.1); width: 32px; height: 32px; border-radius: 8px; border: none; color: #f43f5e; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { background: #f43f5e; color: white; } } 
    } 
  }
  .mobile-view { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; @media (min-width: 1024px) { display: none; }
    .m-card { background: #0D1F2D; padding: 1.2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
      .c-head { display: flex; justify-content: space-between; margin-bottom: 1rem; strong { font-size: 1.1rem; } }
      .c-body { margin-bottom: 1rem; .c-row { display: flex; justify-content: space-between; margin-bottom: 8px; span { color: #64748b; font-size: 0.8rem; } } }
      .del-btn-mob { width: 100%; padding: 10px; background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: none; border-radius: 10px; font-weight: 700; } 
    } 
  }
`;

const StatusBadge = styled.div`
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 50px; font-size: 0.7rem; font-weight: 800;
  background: ${p => p.$status === 'PAID' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 179, 0, 0.1)'};
  color: ${p => p.$status === 'PAID' ? '#00E676' : '#FFB300'};
`;

const Pagination = styled.div`display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem; .nav { display: flex; gap: 10px; button { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 8px; cursor: pointer; &:disabled { opacity: 0.3; } } }`;

const ModalOverlay = styled(motion.div)`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;`;
const ModalBox = styled(motion.div)`
  background: #0D1F2D; width: 100%; max-width: 550px; padding: 2.5rem; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  .modal-header { margin-bottom: 2rem; h3 { margin: 0; font-size: 1.6rem; color: #fff; } p { margin: 5px 0 0; color: #64748b; font-size: 0.85rem; } }
  .form-group { margin-bottom: 1.2rem; label { display: block; font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; } input, select { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 14px; border-radius: 12px; outline: none; font-size: 0.95rem; transition: 0.3s; &:focus { border-color: #f43f5e; box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2); } } } 
  .split { display: grid; grid-template-columns: 1fr; gap: 1rem; @media (min-width: 600px) { grid-template-columns: 1fr 1fr; } } 
  .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 2.5rem; 
    button { padding: 14px 28px; border-radius: 12px; font-weight: 800; cursor: pointer; border: none; transition: 0.3s; 
      &.cancel { background: rgba(255,255,255,0.05); color: #fff; &:hover { background: rgba(255,255,255,0.1); } } 
      &.submit { background: #f43f5e; color: white; &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(244, 63, 94, 0.3); } &:disabled { opacity: 0.5; transform: none; box-shadow: none; } } } }
`;