import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, AlertTriangle, Loader } from 'lucide-react';
import api from '../../api/axios';

const Overlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(10px); `;
const Modal = styled.div` background: #0D1F2D; padding: 2.5rem; border-radius: 24px; width: 450px; border: 1px solid rgba(255,255,255,0.1); `;
const Input = styled.input` width: 100%; padding: 14px; margin: 10px 0 20px 0; background: #04090E; border: 1px solid #333; color: white; border-radius: 12px; outline: none; &:focus { border-color: #FF8C42; } `;
const Select = styled.select` width: 100%; padding: 14px; margin: 10px 0 20px 0; background: #04090E; border: 1px solid #333; color: white; border-radius: 12px; outline: none; `;

const WasteModal = ({ onClose, products }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ batchId: '', quantity: 0, reason: 'EXPIRED' });

  useEffect(() => {
    if (selectedProduct) {
      api.get(`/inventory`).then(res => {
        const productBatches = res.data.batches.filter(b => b.productId._id === selectedProduct || b.productId === selectedProduct);
        setBatches(productBatches);
      });
    }
  }, [selectedProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sales/waste', { 
        productId: selectedProduct, 
        batchId: formData.batchId, 
        quantity: formData.quantity, 
        reason: formData.reason 
      });
      alert("Loss recorded and inventory updated.");
      onClose();
    } catch (err) { alert("Failed to record waste"); }
    finally { setLoading(false); }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle color="#FF8C42" /> Record Inventory Loss
          </h2>
          <X onClick={onClose} style={{ cursor: 'pointer', opacity: 0.4 }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.8rem', opacity: 0.5 }}>Product</label>
          <Select required onChange={e => setSelectedProduct(e.target.value)}>
            <option value="">-- Select Product --</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>

          {selectedProduct && (
            <>
              <label style={{ fontSize: '0.8rem', opacity: 0.5 }}>Specific Batch</label>
              <Select required onChange={e => setFormData({ ...formData, batchId: e.target.value })}>
                <option value="">-- Select Batch --</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    Batch: {b.batchNumber} (Stock: {b.quantity})
                  </option>
                ))}
              </Select>

              <label style={{ fontSize: '0.8rem', opacity: 0.5 }}>Quantity Lost</label>
              <Input type="number" required onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />

              <label style={{ fontSize: '0.8rem', opacity: 0.5 }}>Reason</label>
              <Select onChange={e => setFormData({ ...formData, reason: e.target.value })}>
                <option value="EXPIRED">Expired</option>
                <option value="DAMAGED">Damaged</option>
                <option value="LOST">Lost / Stolen</option>
              </Select>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#FF8C42', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                {loading ? <Loader className="spin" size={20} /> : 'Confirm Loss Recording'}
              </button>
            </>
          )}
        </form>
      </Modal>
    </Overlay>
  );
};

export default WasteModal;