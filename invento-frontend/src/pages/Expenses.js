import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Radio, RefreshCcw, Download, Calendar, 
  Filter, Trash2, Edit3, Search, Loader, Check, X 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../api/axios';

const COLORS = ['#f43f5e', '#00B0FF', '#885AF8', '#fbbf24', '#10b981', '#ec4899', '#6366f1'];

export default function Expenses() {
  // --- STATE ---
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realData, setRealData] = useState({ expenses: [], totalAmount: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewScope, setViewScope] = useState('MONTH');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  }, []);

  const fetchData = useCallback(async () => {
    if (isDemoMode) return setLoading(false);
    setLoading(true);
    try {
      const res = await api.get('/expenses', { 
        params: { month: viewScope === 'MONTH' ? selectedMonth : undefined, year: selectedYear } 
      });
      setRealData(res.data);
    } catch (e) { console.error("Fetch failed"); }
    finally { setLoading(false); }
  }, [isDemoMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeData = useMemo(() => {
    if (!isDemoMode) return realData;
    const cats = ['Staff Salary', 'Internet', 'Marketing', 'Rent', 'Electricity', 'Supplies'];
    const mock = Array.from({ length: 15 }).map((_, i) => ({
      _id: `DEMO-${i}`, 
      title: `${cats[i % cats.length]} Bill`, 
      amount: i === 0 ? 5000000 : Math.floor(Math.random() * 50000), 
      category: cats[i % cats.length], 
      date: new Date().toISOString(), 
      status: 'PAID'
    }));
    return { expenses: mock, totalAmount: mock.reduce((a,b) => a + b.amount, 0) };
  }, [isDemoMode, realData]);

  const groupedChartData = useMemo(() => {
    const map = {};
    activeData.expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [activeData.expenses]);

  const exportCSV = () => {
    const headers = "Date,Description,Category,Amount,Status\n";
    const body = activeData.expenses.map(e => {
        const d = new Date(e.date);
        const shortDate = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        return `${shortDate},${e.title},${e.category},${e.amount},${e.status}`;
    }).join("\n");
    const blob = new Blob([headers + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Expenses.csv'; a.click();
  };

  const filtered = activeData.expenses.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <TopSection>
        <div className="info">
          <div className="mode-tag" onClick={() => setIsDemoMode(!isDemoMode)}>
            <Radio size={12} color={isDemoMode ? "#fbbf24" : "#10b981"} />
            {isDemoMode ? "DEMO MODE" : "LIVE SYSTEM"}
          </div>
          <h1>Money <span>Spent</span></h1>
        </div>

        <div className="toolbar">
          <ControlBar>
            <div className="tab-group">
              <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Monthly</button>
              <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Annual</button>
            </div>
            <SelectWrapper>
              <Calendar size={14} />
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </SelectWrapper>
            {viewScope === 'MONTH' && (
              <SelectWrapper>
                <Filter size={14} />
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </SelectWrapper>
            )}
            <IconButton onClick={fetchData} className={loading ? 'spin' : ''}><RefreshCcw size={16}/></IconButton>
            <IconButton onClick={exportCSV}><Download size={16}/></IconButton>
          </ControlBar>
          <MainAddBtn onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
            <Plus size={20} /> Record Bill
          </MainAddBtn>
        </div>
      </TopSection>

      <StatsGrid>
         <div className="stat-card">
            <label>Total Spend</label>
            <h3>Rwf {activeData.totalAmount.toLocaleString()}</h3>
         </div>
         <div className="stat-card">
            <label>Unpaid Items</label>
            <h3>{activeData.expenses.filter(e => e.status === 'PENDING').length} Bills</h3>
         </div>
      </StatsGrid>

      <ChartsRow>
         <ChartBox className="wide">
            <label>Spending Velocity</label>
            <ResponsiveContainer width="100%" height={250}>
               <AreaChart data={groupedChartData} margin={{ left: -20 }}>
                  <XAxis dataKey="name" tick={{fill:'#64748b', fontSize:10}} axisLine={false} />
                  <Tooltip 
                    contentStyle={{background: '#000', border: '1px solid #333', borderRadius: '8px'}} 
                    itemStyle={{color: '#fff', fontWeight: 'bold'}}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f43f5e" fill="#f43f5e10" strokeWidth={3} />
               </AreaChart>
            </ResponsiveContainer>
         </ChartBox>
         
         <ChartBox>
            <label>Cost Allocation</label>
            <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                  <Pie 
                    data={groupedChartData} 
                    dataKey="value" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={5}
                    stroke="none"
                  >
                     {groupedChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [`Rwf ${val.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                        background: '#000000', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '10px',
                        padding: '10px'
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: '900' }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
               </PieChart>
            </ResponsiveContainer>
         </ChartBox>
      </ChartsRow>

      <TableCard>
         <div className="search-row">
            <Search size={16} />
            <input placeholder="Search records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
         </div>
         <div className="table-scroll">
            <table>
               <thead>
                  <tr>
                     <th>Date</th>
                     <th>Detail</th>
                     <th>Category</th>
                     <th align="right">Amount</th>
                     <th align="right">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {filtered.map(e => (
                    <tr key={e._id}>
                       <td>{new Date(e.date).toLocaleDateString()}</td>
                       <td><strong>{e.title}</strong></td>
                       <td><span className="pill">{e.category}</span></td>
                       <td align="right" style={{color: '#f43f5e', fontWeight: 800}}>Rwf {e.amount.toLocaleString()}</td>
                       <td align="right">
                          <button onClick={() => { setEditingExpense(e); setIsModalOpen(true); }} className="row-btn"><Edit3 size={14}/></button>
                          <button onClick={async () => { if(window.confirm("Delete?")) { await api.delete(`/expenses/${e._id}`); fetchData(); }}} className="row-btn del"><Trash2 size={14}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </TableCard>

      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
             <ModalPanel initial={{x: 400}} animate={{x: 0}} exit={{x: 400}}>
                <div className="m-header">
                   <h2>{editingExpense ? 'Edit Bill' : 'New Bill'}</h2>
                   <X onClick={() => setIsModalOpen(false)} style={{cursor:'pointer'}} />
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const d = Object.fromEntries(new FormData(e.target));
                  if (editingExpense) await api.put(`/expenses/${editingExpense._id}`, d);
                  else await api.post('/expenses', d);
                  setIsModalOpen(false); fetchData();
                }}>
                   <div className="field"><label>Bill Title</label><input name="title" required defaultValue={editingExpense?.title} /></div>
                   <div className="grid">
                      <div className="field"><label>Amount</label><input name="amount" type="number" required defaultValue={editingExpense?.amount} /></div>
                      <div className="field">
                        <label>Date</label>
                        <input name="date" type="date" className="date-box" required defaultValue={editingExpense?.date.split('T')[0]} />
                      </div>
                   </div>
                   <div className="grid">
                      <div className="field">
                        <label>Category</label>
                        <select name="category" defaultValue={editingExpense?.category || 'Rent'}>
                          <option>Rent</option><option>Salary</option><option>Marketing</option><option>Utilities</option><option>Supplies</option><option>Internet</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select name="status" defaultValue={editingExpense?.status || 'PAID'}>
                          <option value="PAID">PAID</option><option value="PENDING">PENDING</option>
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="save-btn">Record Entry</button>
                </form>
             </ModalPanel>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// --- CSS STYLES ---

const PageWrapper = styled(motion.div)` padding: 2rem; max-width: 1500px; margin: 0 auto; background: #020617; min-height: 100vh; font-family: sans-serif; color: white; `;

const TopSection = styled.div` display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 20px;
  .info { .mode-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; color: #94a3b8; cursor: pointer; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1); }
    h1 { font-size: 2.2rem; margin: 0; font-weight: 900; span { color: #f43f5e; } } }
  .toolbar { display: flex; align-items: center; gap: 15px; } `;

const ControlBar = styled.div` display: flex; align-items: center; gap: 12px; background: #0f172a; padding: 6px 15px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
  .tab-group { display: flex; gap: 4px; padding-right: 12px; border-right: 1px solid rgba(255,255,255,0.1); button { background: none; border: none; color: #64748b; padding: 7px 14px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; &.active { background: #fff; color: #000; } } }
  .divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); } `;

const SelectWrapper = styled.div` display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 10px; color: #64748b;
  select { background: none; border: none; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; outline: none; } `;

const IconButton = styled.button` background: none; border: none; color: #64748b; cursor: pointer; transition: 0.3s; &:hover { color: #fff; } &.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `;

const MainAddBtn = styled.button` background: #f43f5e; color: white; border: none; padding: 0 24px; height: 48px; border-radius: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); } `;

const StatsGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;
  .stat-card { background: #0f172a; padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); label { font-size: 0.7rem; color: #64748b; font-weight: 800; } h3 { margin: 10px 0 0; font-size: 1.5rem; font-weight: 900; } } `;

const ChartsRow = styled.div` display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; margin-bottom: 2rem; `;

const ChartBox = styled.div` background: #0f172a; padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); label { font-size: 0.75rem; color: #64748b; font-weight: 800; display: block; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; } &.wide { grid-column: span 8; } grid-column: span 4; `;

const TableCard = styled.div` background: #0f172a; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
  .search-row { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 10px; color: #64748b; input { background: none; border: none; color: #fff; width: 100%; outline: none; } }
  .table-scroll { overflow-x: auto; table { width: 100%; border-collapse: collapse; th { text-align: left; padding: 1.2rem; font-size: 0.75rem; color: #64748b; } td { padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.02); .pill { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; color: #94a3b8; } .row-btn { background: none; border: none; color: #64748b; cursor: pointer; transition: 0.2s; &:hover { color: white; } &.del:hover { color: #f43f5e; } } } } } `;

const ModalOverlay = styled(motion.div)` position: fixed; inset: 0; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(8px); display: flex; justify-content: flex-end; z-index: 5000; `;
const ModalPanel = styled(motion.div)` background: #0D1117; width: 450px; height: 100%; padding: 3rem; border-left: 1px solid rgba(255,255,255,0.1); color: white;
  .m-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; h2 { font-weight: 900; margin: 0; } }
  .field { margin-bottom: 1.5rem; label { display: block; font-size: 0.75rem; font-weight: 800; color: #475569; margin-bottom: 8px; } input, select { width: 100%; background: #161B22; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 14px; border-radius: 12px; outline: none; } 
    .date-box::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; } }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .save-btn { width: 100%; background: #f43f5e; color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 900; cursor: pointer; margin-top: 2rem; } `;