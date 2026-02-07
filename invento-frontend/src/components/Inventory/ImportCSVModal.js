import React, { useState } from 'react';
import styled from 'styled-components';
import { X, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const ImportCSVModal = ({ onClose, onRefresh }) => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        
        // 1. Split by lines and handle both Windows (\r\n) and Unix (\n) line endings
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        
        // 2. Remove header row
        const dataRows = lines.slice(1);

        // 3. Map columns precisely with trimming
        const products = dataRows.map(row => {
          const cols = row.split(',').map(c => c.trim());
          
          // Schema: Name[0], SKU[1], Category[2], Cost[3], Price[4], Qty[5], Expiry[6]
          return {
            name: cols[0],
            sku: cols[1],
            category: cols[2],
            purchasePrice: Number(cols[3]) || 0,
            sellingPrice: Number(cols[4]) || 0,
            quantity: Number(cols[5]) || 0,
            expiryDate: cols[6]
          };
        }).filter(p => p.name && p.sku); // Ensure we don't import broken rows

        if (products.length === 0) throw new Error("No valid data found in CSV");

        // 4. Send to Backend
        await api.post('/inventory/bulk', { products });
        
        alert(`Successfully imported ${products.length} products!`);
        onRefresh();
        onClose();
      } catch (err) {
        console.error("Import logic error:", err);
        alert("Import Failed: Ensure format is Name,SKU,Category,Cost,Price,Qty,Expiry");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Overlay>
      <Modal>
        <header>
          <h3>Bulk Inventory Synchronization</h3>
          <X onClick={onClose} style={{cursor:'pointer', opacity: 0.5}}/>
        </header>
        
        <div className="upload-zone">
          <FileText size={48} color="#007BFF" opacity={0.3} />
          <p>Drop your <strong>.csv</strong> stock file here</p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={e => setFile(e.target.files[0])} 
            style={{marginTop: '1rem'}}
          />
        </div>

        {file && (
          <div className="status-box">
            <CheckCircle size={16} color="#28A745" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB) ready.</span>
          </div>
        )}

        <div className="info-tip">
          <AlertCircle size={14} />
          <span>Format: Name, SKU, Category, Cost, Price, Quantity, Expiry (YYYY-MM-DD)</span>
        </div>

        <button className="import-btn" disabled={!file || isImporting} onClick={handleProcess}>
          {isImporting ? 'Processing Database...' : 'Commit Import'}
        </button>
      </Modal>
    </Overlay>
  );
};

// --- STYLES ---
const Overlay = styled.div` position: fixed; inset: 0; background: rgba(15,23,42,0.9); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const Modal = styled.div`
  background: white; padding: 3rem; border-radius: 24px; width: 450px; color: #0D1F2D;
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; h3 { margin:0; font-weight: 800; } }
  .upload-zone { border: 2px dashed #e2e8f0; padding: 2.5rem; text-align: center; border-radius: 20px; background: #f8fafc; }
  .status-box { display: flex; align-items: center; gap: 10px; background: #ecfdf5; padding: 12px; border-radius: 12px; margin-top: 1.5rem; font-size: 0.85rem; color: #065f46; font-weight: 600; }
  .info-tip { display: flex; align-items: center; gap: 8px; margin-top: 1rem; font-size: 0.7rem; color: #64748b; font-weight: 600; }
  .import-btn { width: 100%; margin-top: 2rem; padding: 1rem; border-radius: 12px; background: #0D1F2D; color: white; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; &:hover { background: #007BFF; } &:disabled { opacity: 0.3; cursor: not-allowed; } }
`;

export default ImportCSVModal;