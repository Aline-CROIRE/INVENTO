import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Radio, RefreshCcw, Download, Calendar, 
  ChevronDown, Filter, Trash2, Edit3, Search, 
  ChevronLeft, ChevronRight, Loader, AlertCircle 
} from 'lucide-react';
import api from '../api/axios';

// Sub-components (Local to this file for simplicity)
import ExpenseStats from '../components/Expenses/ExpenseStats';
import ExpenseCharts from '../components/Expenses/ExpenseCharts';
import ExpenseTable from '../components/Expenses/ExpenseTable';
import ExpenseModal from '../components/Expenses/ExpenseModal';

export default function Expenses() {
  // --- Basic State ---
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realData, setRealData] = useState({ expenses: [], totalAmount: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // --- Date Filters ---
  const [viewScope, setViewScope] = useState('MONTH');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Generate a list of years dynamically (Current year +/- 2)
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  }, []);

  // --- 1. Fetching Data ---
  const fetchData = useCallback(async () => {
    if (isDemoMode) return setLoading(false);
    setLoading(true);
    try {
      const res = await api.get('/expenses', { 
        params: { 
          month: viewScope === 'MONTH' ? selectedMonth : undefined, 
          year: selectedYear 
        } 
      });
      setRealData(res.data);
    } catch (e) {
      console.error("Could not load real data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, viewScope, selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. Demo Data (Lots of items for testing) ---
  const demoData = useMemo(() => {
    const categories = ['Rent', 'Staff Salary', 'Marketing', 'Electricity', 'Internet', 'Supplies'];
    const mockList = Array.from({ length: 25 }).map((_, i) => ({
      _id: `DEMO-${i}`,
      title: `${categories[i % categories.length]} Payment`,
      amount: Math.floor(Math.random() * 200000) + 15000,
      category: categories[i % categories.length],
      date: new Date(2025, selectedMonth - 1, (i % 28) + 1).toISOString(),
      paymentMethod: i % 2 === 0 ? 'Bank Transfer' : 'Cash',
      status: i % 8 === 0 ? 'PENDING' : 'PAID'
    }));
    return {
      expenses: mockList,
      totalAmount: mockList.reduce((sum, item) => sum + item.amount, 0)
    };
  }, [selectedMonth]);

  const activeData = isDemoMode ? demoData : realData;

  // --- 3. CSV Export (Fixed for Excel) ---
  const exportToExcel = () => {
    const headers = ["Date", "Description", "Category", "Amount (Rwf)", "Status"];
    const rows = activeData.expenses.map(e => [
      new Date(e.date).toISOString().split('T')[0], // YYYY-MM-DD format (Best for Excel)
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.status
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Expense_Report_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="page-header">
        <div className="branding">
          <div className="mode-pill" onClick={() => setIsDemoMode(!isDemoMode)}>
             <Radio size={12} color={isDemoMode ? "#fbbf24" : "#10b981"} />
             <span>{isDemoMode ? "TEST MODE (DEMO)" : "LIVE SYSTEM"}</span>
          </div>
          <h1>Business <span>Expenses</span></h1>
        </div>

        <div className="controls">
          <div className="glass-bar">
            <div className="pills">
              <button className={viewScope === 'MONTH' ? 'active' : ''} onClick={() => setViewScope('MONTH')}>Monthly</button>
              <button className={viewScope === 'YEAR' ? 'active' : ''} onClick={() => setViewScope('YEAR')}>Annual</button>
            </div>

            <div className="select-box">
              <Calendar size={14} />
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {viewScope === 'MONTH' && (
              <div className="select-box">
                <Filter size={14} />
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="icon-btns">
               <button onClick={fetchData} className={loading ? 'spin' : ''}><RefreshCcw size={16}/></button>
               <button onClick={exportToExcel} title="Download Excel"><Download size={16}/></button>
            </div>
          </div>

          <button className="add-btn" onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
            <Plus size={20} /> <span>Record Expense</span>
          </button>
        </div>
      </header>

      {/* Stats Cards: Uses "Real Words" */}
      <ExpenseStats data={activeData} />

      {/* Charts: Higher Clarity */}
      <div className="charts-layout">
         <div className="trend"><ExpenseCharts data={activeData} type="area" /></div>
         <div className="categories"><ExpenseCharts data={activeData} type="pie" /></div>
      </div>

      {/* Table: Sorting and Pagination Built-in */}
      <ExpenseTable 
        data={activeData.expenses} 
        loading={loading} 
        onEdit={(exp) => {setEditingExpense(exp); setIsModalOpen(true);}} 
        onRefresh={fetchData}
        isDemo={isDemoMode}
      />

      {/* Slide-in Form */}
      <AnimatePresence>
        {isModalOpen && (
          <ExpenseModal 
            expense={editingExpense} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// --- STYLED COMPONENTS ---

const PageWrapper = styled(motion.div)`
  padding: 2rem; max-width: 1500px; margin: 0 auto; min-height: 100vh; background: #020617; color: #fff;
  
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 20px;
    .branding { 
      .mode-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 50px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; span { font-size: 0.65rem; font-weight: 900; color: #94a3b8; } }
      h1 { font-size: 2.2rem; margin: 0; font-weight: 900; span { color: #f43f5e; } }
    }
    .controls { display: flex; align-items: center; gap: 15px; 
      .glass-bar { display: flex; align-items: center; gap: 12px; background: rgba(15,23,42,0.8); padding: 6px 15px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        .pills { display: flex; gap: 4px; padding-right: 12px; border-right: 1px solid rgba(255,255,255,0.1); button { background: none; border: none; color: #64748b; padding: 6px 12px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; &.active { background: #fff; color: #000; } } }
        .select-box { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); 
          select { background: none; border: none; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; outline: none; option { background: #0f172a; } }
        }
        .icon-btns { display: flex; gap: 10px; color: #64748b; button { background: none; border: none; color: inherit; cursor: pointer; transition: 0.3s; &:hover { color: #fff; } &.spin { animation: spin 1s linear infinite; } } }
      }
      .add-btn { background: #f43f5e; color: white; border: none; padding: 0 24px; height: 48px; border-radius: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); } }
    }
  }

  .charts-layout { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; margin-bottom: 2rem;
    .trend { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 8; } }
    .categories { grid-column: span 12; @media (min-width: 1024px) { grid-column: span 4; } }
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;