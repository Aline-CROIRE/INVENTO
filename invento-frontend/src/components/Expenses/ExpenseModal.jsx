import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import api from '../../api/axios';

export default function ExpenseModal({ expense, onClose, onSuccess }) {
  const [form, setForm] = useState(expense || {
    title: '', amount: '', category: 'Rent', paymentMethod: 'Cash', 
    date: new Date().toISOString().split('T')[0], status: 'PAID'
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (expense) await api.put(`/expenses/${expense._id}`, form);
      else await api.post('/expenses', form);
      onSuccess(); onClose();
    } catch (err) { alert("Save Failed. Check Connection."); }
  };

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Sidebar initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
        <div className="modal-head">
          <h2>{expense ? 'Edit Record' : 'New Expense'}</h2>
          <X onClick={onClose} style={{cursor:'pointer'}}/>
        </div>
        <form onSubmit={handleSave}>
          <div className="field"><label>Expense Description</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Monthly Electricity Bill" /></div>
          <div className="row">
            <div className="field"><label>Amount (Rwf)</label><input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
            <div className="field"><label>Date</label><input type="date" required value={form.date.split('T')[0]} onChange={e => setForm({...form, date: e.target.value})} /></div>
          </div>
          <div className="row">
            <div className="field">
                <label>Category</label>
                <div className="select-wrap">
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        {['Rent', 'Staff Salary', 'Marketing', 'Electricity', 'Internet', 'Supplies', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="arrow" />
                </div>
            </div>
            <div className="field">
                <label>Status</label>
                <div className="select-wrap">
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="PAID">PAID</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                    <ChevronDown size={14} className="arrow" />
                </div>
            </div>
          </div>
          <button type="submit" className="save-btn"><Check size={20}/> Save to Ledger</button>
        </form>
      </Sidebar>
    </Overlay>
  );
}

const Overlay = styled(motion.div)` position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: flex-end; z-index: 3000; `;
const Sidebar = styled(motion.div)` background: #0D1117; width: 100%; max-width: 500px; height: 100%; padding: 3rem; border-left: 1px solid rgba(255,255,255,0.1); .modal-head { display: flex; justify-content: space-between; margin-bottom: 3rem; h2 { font-weight: 900; letter-spacing: 1px; } }
  .field { margin-bottom: 1.5rem; label { display: block; font-size: 0.65rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; } 
    input, select { width: 100%; background: #161B22; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 15px; border-radius: 12px; outline: none; font-weight: 700; &:focus { border-color: #f43f5e; } } 
    .select-wrap { position: relative; select { appearance: none; } .arrow { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #475569; } } }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .save-btn { width: 100%; background: #f43f5e; color: white; border: none; padding: 18px; border-radius: 16px; font-weight: 900; cursor: pointer; margin-top: 2rem; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); } } `;