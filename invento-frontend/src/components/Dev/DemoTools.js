import React, { useState } from 'react';
import styled from 'styled-components';
import { Database, PlusCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../../api/axios';

const DemoTools = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleAppend = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/system/inject'); 
      setStatus('success');
      alert("55 New Records added to your history!");
      window.location.reload(); 
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="label"><Database size={14}/> Demo Engine</div>
      <button onClick={handleAppend} disabled={loading}>
        {loading ? <Loader className="spin" size={14}/> : <PlusCircle size={14}/>}
        {loading ? 'Adding...' : 'Add 55 Demo Records'}
      </button>
      {status === 'success' && <span className="success"><CheckCircle size={14}/> Added!</span>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: fixed; bottom: 20px; right: 20px; background: #0D1F2D; border: 1px solid #007BFF; padding: 8px 15px; border-radius: 50px; display: flex; align-items: center; gap: 12px; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  .label { color: #007BFF; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 6px; text-transform: uppercase; }
  button { background: #007BFF; color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; &:disabled { opacity: 0.7; } }
  .spin { animation: spin 1s linear infinite; }
  .success { color: #28A745; font-size: 0.75rem; font-weight: 700; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default DemoTools;