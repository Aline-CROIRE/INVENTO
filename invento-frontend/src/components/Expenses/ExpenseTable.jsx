import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, Edit3, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export default function ExpenseTable({ data, loading, onEdit, onRefresh, isDemo }) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // --- Logic: Sorting ---
  const sortedData = [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.dir === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  }).filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  // --- Logic: Pagination ---
  const paginated = sortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

  // --- Logic: Alert for bills unpaid for 15+ days ---
  const isStale = (date) => (new Date() - new Date(date)) > (15 * 24 * 60 * 60 * 1000);

  const handleDelete = async (id) => {
    if (isDemo) return alert("Simulation Mode: Action not allowed.");
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      onRefresh();
    } catch (e) {
      alert("Error deleting record.");
    }
  };

  const toggleSort = (key) => {
    setSortConfig({ key, dir: sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <TableWrapper>
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input 
            placeholder="Search by description..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
      </div>

      <div className="scroll-container">
        <StyledTable>
          <thead>
            <tr>
              <th className="w-date" onClick={() => toggleSort('date')}>
                Date <ArrowUpDown size={12} />
              </th>
              <th className="w-desc" onClick={() => toggleSort('title')}>
                Description <ArrowUpDown size={12} />
              </th>
              <th className="w-cat">Category</th>
              <th className="w-amt text-right" onClick={() => toggleSort('amount')}>
                Amount <ArrowUpDown size={12} />
              </th>
              <th className="w-status">Status</th>
              <th className="w-action text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan="6" className="empty">No expenses found for this period.</td></tr>
            ) : paginated.map(exp => (
              <tr key={exp._id}>
                <td className="date-cell">{new Date(exp.date).toLocaleDateString()}</td>
                <td>
                  <div className="desc-content">
                    <strong>{exp.title}</strong>
                    {exp.status === 'PENDING' && isStale(exp.date) && (
                      <span className="overdue-tag"><AlertCircle size={10}/> OVERDUE</span>
                    )}
                  </div>
                </td>
                <td><span className="category-pill">{exp.category}</span></td>
                <td className="amount-cell text-right">Rwf {exp.amount.toLocaleString()}</td>
                <td><StatusBadge $status={exp.status}>{exp.status}</StatusBadge></td>
                <td className="text-right">
                  <div className="action-btns">
                    <button className="edit" onClick={() => onEdit(exp)} title="Edit"><Edit3 size={16}/></button>
                    <button className="delete" onClick={() => handleDelete(exp._id)} title="Delete"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </div>

      <PaginationArea>
        <p>Page {page} of {totalPages}</p>
        <div className="nav-buttons">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={18}/></button>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={18}/></button>
        </div>
      </PaginationArea>
    </TableWrapper>
  );
}

// --- STYLED COMPONENTS (The Alignment Fix) ---

const TableWrapper = styled.div`
  background: #0f172a;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.05);
  overflow: hidden;

  .table-toolbar {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    .search-box {
      display: flex; align-items: center; gap: 12px;
      background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
      padding: 0 15px; border-radius: 12px; width: 350px;
      color: #64748b;
      input {
        background: none; border: none; color: white; padding: 12px 0; outline: none; width: 100%;
        font-weight: 600; &::placeholder { color: #475569; }
      }
    }
  }

  .scroll-container { overflow-x: auto; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* CRITICAL: Forces headers and body to align perfectly */

  th {
    padding: 1.2rem;
    text-align: left;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    cursor: pointer;
    &:hover { color: white; }
    svg { margin-left: 5px; vertical-align: middle; }
  }

  td {
    padding: 1.2rem;
    border-bottom: 1px solid rgba(255,255,255,0.02);
    vertical-align: middle;
    font-size: 0.9rem;
    color: #f8fafc;
  }

  /* Column Width Alignment */
  .w-date { width: 120px; }
  .w-desc { width: auto; }
  .w-cat { width: 140px; }
  .w-amt { width: 180px; }
  .w-status { width: 120px; }
  .w-action { width: 100px; }

  .text-right { text-align: right; }

  .date-cell { color: #64748b; font-family: monospace; }
  
  .desc-content {
    display: flex; flex-direction: column; gap: 4px;
    strong { font-size: 0.95rem; }
    .overdue-tag { color: #f43f5e; font-size: 0.6rem; font-weight: 900; display: flex; align-items: center; gap: 4px; }
  }

  .category-pill {
    background: rgba(255,255,255,0.05);
    padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: #94a3b8;
  }

  .amount-cell { color: #f43f5e; font-weight: 900; font-size: 1.05rem; }

  .action-btns {
    display: flex; gap: 12px; justify-content: flex-end;
    button {
      background: none; border: none; color: #475569; cursor: pointer; transition: 0.2s;
      &:hover { color: white; }
      &.delete:hover { color: #f43f5e; }
    }
  }

  .empty { padding: 4rem; text-align: center; color: #475569; font-weight: 600; }
`;

const StatusBadge = styled.span`
  font-size: 0.65rem; font-weight: 900; padding: 4px 12px; border-radius: 50px; text-transform: uppercase;
  background: ${p => p.$status === 'PAID' ? '#10b98120' : '#fbbf2420'};
  color: ${p => p.$status === 'PAID' ? '#10b981' : '#fbbf24'};
  border: 1px solid ${p => p.$status === 'PAID' ? '#10b98140' : '#fbbf2440'};
`;

const PaginationArea = styled.div`
  display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem;
  p { font-size: 0.8rem; color: #475569; font-weight: 600; }
  .nav-buttons {
    display: flex; gap: 8px;
    button {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: white; padding: 6px; border-radius: 8px; cursor: pointer;
      &:disabled { opacity: 0.2; cursor: not-allowed; }
      &:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
    }
  }
`;