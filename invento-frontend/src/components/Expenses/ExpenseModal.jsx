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
      onSuccess(); 
      onClose();
    } catch (err) { 
      alert("System Error: Could not save record."); 
    }
  };

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Sidebar 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="modal-head">
          <div className="title-group">
            <div className="indicator" />
            <h2>{expense ? 'Update Record' : 'New Expense'}</h2>
          </div>
          <button className="close-x" onClick={onClose}><X size={20}/></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="field">
            <label>Bill Description</label>
            <input 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              placeholder="e.g. Warehouse Monthly Rent" 
            />
          </div>

          <div className="grid">
            <div className="field">
              <label>Amount (Rwf)</label>
              <input 
                type="number" 
                required 
                value={form.amount} 
                onChange={e => setForm({...form, amount: e.target.value})} 
              />
            </div>
            <div className="field">
              <label>Due Date</label>
              <input 
                type="date" 
                className="date-input"
                required 
                value={form.date.split('T')[0]} 
                onChange={e => setForm({...form, date: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid">
            <div className="field">
                <label>Category</label>
                <div className="select-wrap">
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        {['Rent', 'Staff Salary', 'Marketing', 'Electricity', 'Internet', 'Supplies', 'Other'].map(c => (
                           <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="arrow" />
                </div>
            </div>
            <div className="field">
                <label>Payment Status</label>
                <div className="select-wrap">
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="PAID">PAID (Done)</option>
                        <option value="PENDING">PENDING (Unpaid)</option>
                    </select>
                    <ChevronDown size={14} className="arrow" />
                </div>
            </div>
          </div>

          <div className="footer-actions">
            <button type="button" className="discard-btn" onClick={onClose}>Discard</button>
            <button type="submit" className="save-btn"><Check size={20}/> Save Entry</button>
          </div>
        </form>
      </Sidebar>
    </Overlay>
  );
}

// --- STYLES ---

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(10px); display: flex; justify-content: flex-end; z-index: 3000;
`;

const Sidebar = styled(motion.div)`
  background: #0D1117; width: 100%; max-width: 500px; height: 100%;
  padding: 3rem; border-left: 1px solid rgba(255,255,255,0.1);
  box-shadow: -20px 0 50px rgba(0,0,0,0.5); overflow-y: auto;

  .modal-head {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem;
    .title-group {
      display: flex; align-items: center; gap: 12px;
      .indicator { width: 4px; height: 20px; background: #f43f5e; border-radius: 10px; }
      h2 { font-size: 1.4rem; font-weight: 900; letter-spacing: 0.5px; color: #fff; margin: 0; }
    }
    .close-x { background: rgba(255,255,255,0.03); border: none; color: #64748b; padding: 8px; border-radius: 10px; cursor: pointer; &:hover { color: #fff; } }
  }

  .field {
    margin-bottom: 2rem;
    label { display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    
    input, select {
      width: 100%; background: #161B22; border: 1px solid #30363D;
      color: #fff; padding: 15px; border-radius: 14px; font-weight: 700;
      font-size: 0.95rem; outline: none; transition: 0.3s;
      
      &:focus { border-color: #f43f5e; background: #0D1117; }
    }

    /* --- DATE ICON FIX: Forces the calendar icon to be WHITE --- */
    .date-input::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(1) brightness(100%); /* Turns the dark icon white */
      opacity: 0.7;
      &:hover { opacity: 1; }
    }

    .select-wrap {
      position: relative;
      select { appearance: none; cursor: pointer; }
      .arrow { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #475569; }
    }
  }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

  .footer-actions {
    margin-top: 3.5rem; display: flex; gap: 1rem;
    button { flex: 1; padding: 18px; border-radius: 16px; font-weight: 900; cursor: pointer; transition: 0.2s; }
    .discard-btn { background: transparent; border: 1px solid #30363D; color: #64748b; &:hover { color: #fff; border-color: #475569; } }
    .save-btn { background: #f43f5e; color: white; border: none; display: flex; align-items: center; justify-content: center; gap: 10px; &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); } }
  }
`;