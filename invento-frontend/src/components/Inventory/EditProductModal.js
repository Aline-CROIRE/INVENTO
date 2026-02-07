import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Save } from 'lucide-react';
import api from '../../api/axios';

const EditProductModal = ({ product, onClose, onRefresh }) => {
  const [form, setForm] = useState({ ...product });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/inventory/${product._id}`, form);
      alert("Product details updated.");
      onRefresh();
      onClose();
    } catch (e) { alert("Update failed"); }
  };

  return (
    <Overlay>
      <Modal>
        <header>
          <h2>Edit Product Property</h2>
          <X onClick={onClose} style={{cursor:'pointer'}}/>
        </header>
        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>Display Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>SKU Identification</label>
            <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Minimum Stock Threshold</label>
            <input type="number" value={form.minStockLevel} onChange={e => setForm({...form, minStockLevel: e.target.value})} />
          </div>
          <button type="submit" className="save-btn"><Save size={18}/> Update System Metadata</button>
        </form>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div` position: fixed; inset: 0; background: rgba(15,23,42,0.9); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const Modal = styled.div`
  background: white; width: 450px; padding: 2.5rem; border-radius: 24px; color: #0D1F2D;
  header { display: flex; justify-content: space-between; margin-bottom: 2rem; h2 { margin: 0; font-size: 1.4rem; } }
  .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; } input { padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; outline: none; font-weight: 600; &:focus { border-color: #007BFF; } } }
  .save-btn { width: 100%; padding: 14px; background: #0D1F2D; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; gap: 8px; }
`;

export default EditProductModal;