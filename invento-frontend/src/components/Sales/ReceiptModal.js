import React from 'react';
import styled from 'styled-components';
import { Printer, X, Download } from 'lucide-react';

const ReceiptModal = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Overlay>
      <Container>
        <div className="no-print actions">
          <button onClick={handlePrint}><Printer size={18}/> Print / Download PDF</button>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        
        <Bill id="bill-content">
          <header>
            <h2>INVENTO SHOP</h2>
            <p>Official Purchase Receipt</p>
          </header>

          <div className="details">
            <p>Date: {new Date(sale.createdAt).toLocaleString()}</p>
            <p>Receipt No: {sale._id.toUpperCase()}</p>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th align="left">Description</th>
                <th align="center">Qty</th>
                <th align="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.productId?.name || 'Item'}</td>
                  <td align="center">{item.quantity}</td>
                  <td align="right">{(item.priceAtSale * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div className="row">
              <span>SUBTOTAL</span>
              <span>{sale.totalAmount.toLocaleString()} RWF</span>
            </div>
            <div className="row bold">
              <span>TOTAL</span>
              <span>{sale.totalAmount.toLocaleString()} RWF</span>
            </div>
          </div>

          <footer>
            <p>Thank you for shopping with us!</p>
            <p>Software by INVENTO US-IIS</p>
          </footer>
        </Bill>
        
        <button className="no-print close-btn" onClick={onClose}>Finish Transaction</button>
      </Container>
    </Overlay>
  );
};

const Overlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; z-index: 2000; @media print { background: white; position: static; } `;
const Container = styled.div` width: 400px; display: flex; flex-direction: column; gap: 1rem; .no-print { @media print { display: none; } } .actions { display: flex; justify-content: space-between; button { background: #333; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; gap: 8px; } } .close-btn { background: #28A745; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; cursor: pointer; } `;
const Bill = styled.div` background: white; color: black; padding: 2rem; font-family: 'Courier New', monospace; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border-radius: 4px; @media print { box-shadow: none; width: 100%; padding: 0; } header { text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 1rem; margin-bottom: 1rem; h2 { margin: 0; } p { font-size: 0.8rem; margin: 5px 0 0 0; } } .details { font-size: 0.75rem; margin-bottom: 1rem; p { margin: 2px 0; } } .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; th { font-size: 0.8rem; border-bottom: 1px solid #eee; padding-bottom: 5px; } td { padding: 8px 0; font-size: 0.85rem; } } .totals { border-top: 1px dashed #ccc; padding-top: 1rem; .row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px; } .bold { font-weight: bold; font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; } } footer { text-align: center; margin-top: 2rem; font-size: 0.7rem; border-top: 1px solid #eee; padding-top: 1rem; } `;

export default ReceiptModal;