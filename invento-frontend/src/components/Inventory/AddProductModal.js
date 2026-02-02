import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import api from '../../api/axios';

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

const Modal = styled.div`
  background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem;
  border-radius: 24px; width: 100%; max-width: 600px; position: relative;
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
  input, select { 
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    padding: 12px; border-radius: 8px; color: white; outline: none;
    &:focus { border-color: var(--blue); }
  }
`;

const SubmitBtn = styled.button`
  width: 100%; background: var(--green); color: white; padding: 14px;
  border-radius: 12px; font-weight: bold; margin-top: 2rem;
`;

const AddProductModal = ({ onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unit: 'pcs',
    minStockLevel: 5, batchNumber: '', purchasePrice: 0,
    sellingPrice: 0, quantity: 0, expiryDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', formData);
      onRefresh();
      onClose();
    } catch (err) { alert(err.response?.data?.message || 'Error adding product'); }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <X size={24} style={{ position: 'absolute', right: 25, top: 25, cursor: 'pointer' }} onClick={onClose} />
        <h2 style={{ margin: 0 }}>Add New Inventory</h2>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <InputGroup><label>Product Name</label><input required onChange={e => setFormData({...formData, name: e.target.value})} /></InputGroup>
            <InputGroup><label>SKU</label><input required onChange={e => setFormData({...formData, sku: e.target.value})} /></InputGroup>
            <InputGroup><label>Category</label><input required onChange={e => setFormData({...formData, category: e.target.value})} /></InputGroup>
            <InputGroup><label>Unit</label><select onChange={e => setFormData({...formData, unit: e.target.value})}><option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="ltr">Liters</option></select></InputGroup>
            <InputGroup><label>Min Stock Alert</label><input type="number" onChange={e => setFormData({...formData, minStockLevel: e.target.value})} /></InputGroup>
            <InputGroup><label>Batch Number</label><input required onChange={e => setFormData({...formData, batchNumber: e.target.value})} /></InputGroup>
            <InputGroup><label>Purchase Price ($)</label><input type="number" step="0.01" required onChange={e => setFormData({...formData, purchasePrice: e.target.value})} /></InputGroup>
            <InputGroup><label>Selling Price ($)</label><input type="number" step="0.01" required onChange={e => setFormData({...formData, sellingPrice: e.target.value})} /></InputGroup>
            <InputGroup><label>Initial Quantity</label><input type="number" required onChange={e => setFormData({...formData, quantity: e.target.value})} /></InputGroup>
            <InputGroup><label>Expiry Date</label><input type="date" required onChange={e => setFormData({...formData, expiryDate: e.target.value})} /></InputGroup>
          </FormGrid>
          <SubmitBtn type="submit">Add to Inventory</SubmitBtn>
        </form>
      </Modal>
    </Overlay>
  );
};

export default AddProductModal;