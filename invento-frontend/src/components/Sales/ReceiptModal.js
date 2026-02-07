import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle, Copy, Share2, ArrowLeft } from 'lucide-react';

const ReceiptModal = ({ sale, onClose }) => {
  if (!sale) return null;

  const totalRevenue = sale.financials?.totalRevenue || 0;
  const lineItems = sale.lineItems || [];
  const refId = (sale._id || 'Pending').toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Container
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* UI Controls - Hidden during print */}
          <Toolbar className="no-print">
            <div className="status">
              <CheckCircle size={18} color="#00E676" />
              <span>Transaction Success</span>
            </div>
            <div className="actions">
              <button onClick={handlePrint} className="print-btn">
                <Printer size={18} />
              </button>
              <button onClick={onClose} className="close-btn">
                <X size={18} />
              </button>
            </div>
          </Toolbar>

          <ScrollArea>
            <ReceiptPaper id="receipt">
              {/* Receipt Header */}
              <BrandSection>
                <LogoWrapper>
                  <img src="/logo.png" alt="Invento Logo" />
                </LogoWrapper>
                <h2>INVENTO</h2>
                <p className="subtitle">Intelligence Inventory System</p>
                <p className="address">Kigali, Rwanda • +250 788 000 000</p>
              </BrandSection>

              <Divider />

              {/* Meta Data */}
              <MetaGrid>
                <div className="meta-item">
                  <label>DATE / TIME</label>
                  <span>{new Date(sale.committedAt || Date.now()).toLocaleString()}</span>
                </div>
                <div className="meta-item right">
                  <label>REFERENCE ID</label>
                  <span>#{refId.slice(-8)}</span>
                </div>
              </MetaGrid>

              <Divider />

              {/* Items Table */}
              <ItemsTable>
                <thead>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th align="center">QTY</th>
                    <th align="right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div className="item-name">{item.name || 'Product'}</div>
                        <small>{item.sku || 'N/A'}</small>
                      </td>
                      <td align="center">x{item.quantity}</td>
                      <td align="right">
                        {(item.soldPrice * item.quantity || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ItemsTable>

              <Divider />

              {/* Financials */}
              <TotalSection>
                <div className="sub-row">
                  <span>Subtotal</span>
                  <span>Rwf {totalRevenue.toLocaleString()}</span>
                </div>
                <div className="sub-row">
                  <span>Tax (Included)</span>
                  <span>Rwf 0</span>
                </div>
                <div className="grand-total">
                  <span>TOTAL PAID</span>
                  <span>Rwf {totalRevenue.toLocaleString()}</span>
                </div>
              </TotalSection>

              <Divider />

              {/* Receipt Footer */}
              <FooterSection>
                <div className="barcode-placeholder">
                  {/* Visual purely for aesthetic */}
                  <div className="barcode-lines" />
                  <span>#{refId}</span>
                </div>
                <p>Thank you for choosing Invento.</p>
                <p className="policy">Verified Digital Audit Receipt</p>
              </FooterSection>
            </ReceiptPaper>
          </ScrollArea>

          {/* Bottom UI Button */}
          <div className="no-print" style={{ padding: '0 20px 20px' }}>
            <NewSaleBtn onClick={onClose}>
               Start New Transaction
            </NewSaleBtn>
          </div>
        </Container>
      </Overlay>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            box-shadow: none; 
            padding: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </AnimatePresence>
  );
};

// --- STYLES ---

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(4, 9, 14, 0.95);
  backdrop-filter: blur(10px);
  z-index: 2500;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Container = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: #0D1F2D;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #00E676;
    font-weight: 800;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .actions {
    display: flex;
    gap: 10px;
    button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.2s;
      &:hover { background: #00B0FF; border-color: #00B0FF; }
    }
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
`;

const ReceiptPaper = styled.div`
  background: #fff;
  color: #000;
  padding: 40px 30px;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const BrandSection = styled.div`
  text-align: center;
  h2 { margin: 10px 0 0; font-weight: 900; letter-spacing: -1px; font-size: 1.5rem; }
  .subtitle { font-size: 0.7rem; font-weight: 700; color: #555; text-transform: uppercase; }
  .address { font-size: 0.65rem; color: #888; margin-top: 5px; }
`;

const LogoWrapper = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto;
  img { width: 100%; height: 100%; object-fit: contain; }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 20px 0;
  .meta-item {
    label { display: block; font-size: 0.6rem; font-weight: 800; color: #999; margin-bottom: 2px; }
    span { font-size: 0.75rem; font-weight: 700; color: #000; }
  }
  .right { text-align: right; }
`;

const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  th { font-size: 0.65rem; color: #999; padding-bottom: 10px; text-align: left; font-weight: 800; }
  td { padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 0.8rem; }
  .item-name { font-weight: 700; }
  small { display: block; font-size: 0.65rem; color: #888; }
`;

const TotalSection = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .sub-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #666;
  }
  .grand-total {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 2px solid #000;
    font-weight: 900;
    font-size: 1.2rem;
  }
`;

const FooterSection = styled.div`
  text-align: center;
  margin-top: 30px;
  p { font-size: 0.75rem; font-weight: 600; margin-bottom: 4px; }
  .policy { font-size: 0.6rem; color: #999; text-transform: uppercase; }
  
  .barcode-placeholder {
    margin-bottom: 15px;
    .barcode-lines {
        height: 30px;
        background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);
        margin: 0 auto 5px;
        width: 150px;
    }
    span { font-size: 0.6rem; font-family: monospace; color: #888; }
  }
`;

const Divider = styled.div`
  height: 1px;
  border-top: 1px dashed #ccc;
  margin: 10px 0;
`;

const NewSaleBtn = styled.button`
  width: 100%;
  background: #00E676;
  color: #04090E;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-weight: 900;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 10px 20px rgba(0, 230, 118, 0.2);
  &:hover { transform: translateY(-2px); background: #00c866; }
`;

export default ReceiptModal;