import React from 'react';
import styled from 'styled-components';
import { X, Calendar, Hash, Tag } from 'lucide-react';

const ProductDetailsModal = ({ product, batches, onClose }) => {
  return (
    <Overlay>
      <Modal>
        <header>
          <div>
            <span className="cat">{product.category}</span>
            <h2>{product.name} — Batch Traceability</h2>
          </div>
          <X onClick={onClose} style={{cursor:'pointer'}}/>
        </header>

        <BatchList>
          {batches.length === 0 ? <p>No active batches found for this product.</p> : batches.map(b => (
            <BatchCard key={b._id}>
              <div className="main">
                <div className="qty"><strong>{b.quantity}</strong> / {b.initialQuantity} {product.unit}</div>
                <div className="expiry"><Calendar size={14}/> Expires: {new Date(b.expiryDate).toLocaleDateString()}</div>
              </div>
              <div className="meta">
                <span><Hash size={12}/> Ref: {b.batchNumber}</span>
                <span><Tag size={12}/> Cost: {b.purchasePrice.toLocaleString()} RWF</span>
              </div>
            </BatchCard>
          ))}
        </BatchList>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); `;
const Modal = styled.div` background: #0D1F2D; width: 500px; padding: 2.5rem; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); header { display: flex; justify-content: space-between; margin-bottom: 2rem; .cat { color: #007BFF; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; } h2 { margin-top: 5px; font-size: 1.4rem; } } `;
const BatchList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const BatchCard = styled.div` background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 20px; .main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; .qty { font-size: 1.1rem; strong { color: #28A745; } } .expiry { font-size: 0.8rem; color: #FF8C42; display: flex; align-items: center; gap: 6px; } } .meta { display: flex; justify-content: space-between; font-size: 0.75rem; opacity: 0.5; span { display: flex; align-items: center; gap: 5px; } } `;

export default ProductDetailsModal;