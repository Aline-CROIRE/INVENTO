import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  X, AlertTriangle, Zap, Package, 
  DollarSign, Calendar, Plus, Info, Loader, ChevronDown 
} from 'lucide-react';
import api from '../../api/axios';

const AddProductModal = ({ onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'General', unit: 'pcs',
    minStockLevel: 5, batchNumber: '', purchasePrice: 0,
    sellingPrice: 0, quantity: 0, expiryDate: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    "General", "Dairy", "Grains & Staples", "Electronics", 
    "Hygiene", "Beverages", "Household", "Fresh Produce"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/inventory', formData);
      onRefresh();
      onClose();
    } catch (err) { 
      alert(err.response?.data?.message || 'Database error.'); 
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Overlay 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <Modal 
        initial={{ scale: 0.95, y: 30 }} 
        animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <header>
          <div className="title-group">
            <div className="icon-wrap"><Plus size={22}/></div>
            <div>
                <label>Asset Management</label>
                <h1>New Product</h1>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24}/></button>
        </header>

        <StyledForm onSubmit={handleSubmit}>
          <ScrollArea>
            
            <SectionTitle><Package size={16}/> Identity & Sector</SectionTitle>
            <FormGrid>
              <InputGroup className="full">
                <label>Full Product Name</label>
                <input required placeholder="e.g. Inyange Whole Milk 500ml" onChange={e => setFormData({...formData, name: e.target.value})} />
              </InputGroup>
              
              <InputGroup>
                <label>Unique SKU / Barcode</label>
                <input required placeholder="MILK-001-B" onChange={e => setFormData({...formData, sku: e.target.value})} />
              </InputGroup>

              <InputGroup>
                <label>Business Sector</label>
                <div className="select-wrap">
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronDown size={16} className="chevron" />
                </div>
              </InputGroup>

              <InputGroup>
                <label>Measurement Unit</label>
                <div className="select-wrap">
                    <select onChange={e => setFormData({...formData, unit: e.target.value})}>
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ltr">Liters (ltr)</option>
                        <option value="box">Bulk Boxes</option>
                    </select>
                    <ChevronDown size={16} className="chevron" />
                </div>
              </InputGroup>

              <InputGroup>
                <label>Initial Batch Number</label>
                <input required placeholder="BN-2026-01" onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
              </InputGroup>
            </FormGrid>

            <SectionTitle><AlertTriangle size={16} color="#FF9100"/> Safety Threshold</SectionTitle>
            <ThresholdCard>
                <div className="input-side">
                    <InputGroup>
                        <label>Trigger Amount</label>
                        <input 
                            type="number" 
                            value={formData.minStockLevel}
                            onChange={e => setFormData({...formData, minStockLevel: e.target.value})}
                        />
                    </InputGroup>
                </div>
                <div className="info-side">
                    <div className="msg">
                        <Info size={18} />
                        <p>
                            System flags alerts when stock drops to <strong>{formData.minStockLevel || 0} {formData.unit}</strong>.
                        </p>
                    </div>
                </div>
            </ThresholdCard>

            <SectionTitle><DollarSign size={16}/> Costing & Strategy</SectionTitle>
            <FormGrid>
              <InputGroup>
                <label>Purchase Price (Rwf)</label>
                <input type="number" step="1" required className="mono-green" onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
              </InputGroup>
              <InputGroup>
                <label>Selling Price (Rwf)</label>
                <input type="number" step="1" required className="mono-blue" onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
              </InputGroup>
              <InputGroup>
                <label>Initial Quantity</label>
                <input type="number" required placeholder="0" onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </InputGroup>
              <InputGroup>
                <label>Expiry Date</label>
                <div className="date-wrap">
                    <Calendar size={16} />
                    <input type="date" required onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </InputGroup>
            </FormGrid>

          </ScrollArea>

          <Footer>
             <button type="button" className="cancel" onClick={onClose}>Cancel</button>
             <SubmitBtn type="submit" disabled={isSaving}>
                {isSaving ? <Loader className="spin" size={20}/> : <><Zap size={18}/> Commit Asset</>}
             </SubmitBtn>
          </Footer>
        </StyledForm>
      </Modal>
    </Overlay>
  );
};

// --- STYLES ---

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(4, 9, 14, 0.95); backdrop-filter: blur(15px);
  display: flex; justify-content: center; align-items: flex-start; z-index: 2000; padding: 20px;
  overflow-y: auto;
  @media (min-width: 768px) { align-items: center; }
`;

const Modal = styled(motion.div)`
  background: #0D1F2D; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
  width: 100%; max-width: 750px; 
  height: auto;
  max-height: 95vh;
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6);

  @media (min-width: 768px) { border-radius: 40px; }

  header {
    flex-shrink: 0;
    padding: 1.5rem; 
    border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;
    
    @media (min-width: 768px) { padding: 2rem 2.5rem; }

    .title-group { display: flex; align-items: center; gap: 15px;
        .icon-wrap { width: 40px; height: 40px; background: rgba(0, 123, 255, 0.1); color: #007BFF; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        label { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        h1 { font-size: 1.25rem; font-weight: 900; color: white; margin: 0; }
        
        @media (min-width: 768px) {
            gap: 20px;
            .icon-wrap { width: 50px; height: 50px; border-radius: 15px; }
            h1 { font-size: 1.8rem; }
        }
    }
    .close-btn { background: none; border: none; color: #475569; cursor: pointer; transition: 0.2s; &:hover { color: white; } }
  }
`;

const StyledForm = styled.form`
  display: flex; flex-direction: column; flex: 1; overflow: hidden;
`;

const ScrollArea = styled.div` 
  flex: 1; overflow-y: auto; padding: 1.5rem; 
  @media (min-width: 768px) { padding: 2rem 2.5rem; }

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 123, 255, 0.2); border-radius: 10px; }
`;

const SectionTitle = styled.div`
  display: flex; align-items: center; gap: 10px; font-size: 0.7rem; font-weight: 900; color: #64748b;
  text-transform: uppercase; letter-spacing: 1.5px; margin: 1.5rem 0 1rem 0;
  &:first-child { margin-top: 0; }
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 1rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
    .full { grid-column: span 2; }
  }
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
  input, select { 
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    padding: 12px; border-radius: 10px; color: white; outline: none; font-weight: 600; width: 100%; transition: 0.2s; font-size: 0.9rem;
    &:focus { border-color: #007BFF; background: rgba(0, 123, 255, 0.05); }
    &.mono-green { font-family: 'JetBrains Mono', monospace; color: #00E676; }
    &.mono-blue { font-family: 'JetBrains Mono', monospace; color: #00B0FF; }
  }
  .select-wrap, .date-wrap { position: relative; display: flex; align-items: center; 
    .chevron, svg { position: absolute; right: 12px; pointer-events: none; color: #64748b; }
    option { background: #0D1F2D; color: white; }
  }
  .date-wrap svg { left: 12px; right: auto; color: #00B0FF; }
  .date-wrap input { padding-left: 40px; }

  @media (min-width: 768px) {
    input, select { padding: 14px; border-radius: 12px; }
    .date-wrap input { padding-left: 45px; }
  }
`;

const ThresholdCard = styled.div`
  background: rgba(255, 145, 0, 0.03); border: 1px solid rgba(255, 145, 0, 0.1);
  padding: 1.2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row; gap: 2rem; align-items: center; padding: 1.5rem; border-radius: 20px;
    .input-side { width: 160px; }
  }

  .info-side { flex: 1; 
    .msg { display: flex; gap: 12px; color: #94a3b8; font-size: 0.8rem; line-height: 1.5; 
        svg { flex-shrink: 0; color: #FF9100; }
        strong { color: white; }
    }
  }
`;

const Footer = styled.div`
  flex-shrink: 0; padding: 1.5rem; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem;
  
  @media (min-width: 768px) { padding: 2rem 2.5rem; gap: 2rem; }

  .cancel { background: none; border: none; color: #64748b; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
`;

const SubmitBtn = styled.button`
  background: linear-gradient(135deg, #00E676 0%, #00B0FF 100%); color: white; border: none;
  padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 900; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s;
  box-shadow: 0 10px 30px rgba(0, 230, 118, 0.2); font-size: 0.9rem;

  @media (min-width: 768px) { padding: 1rem 3rem; border-radius: 15px; font-size: 1rem; }

  &:hover { transform: translateY(-3px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default AddProductModal;