import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Overlay = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const Modal = styled.div` background: #0D1F2D; padding: 2rem; border-radius: 20px; width: 400px; border: 1px solid #333; `;
const Input = styled.input` width: 100%; padding: 12px; margin: 10px 0; background: #04090E; border: 1px solid #333; color: white; border-radius: 8px; `;
const Select = styled.select` width: 100%; padding: 12px; margin: 10px 0; background: #04090E; border: 1px solid #333; color: white; border-radius: 8px; `;

const CreateUserModal = ({ onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ email: '', role: user.role === 'ADMIN' ? 'OWNER' : 'WORKER', shopName: '', address: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Corrected Route: /api/users (Matches Backend Step 1)
      await api.post('/users', formData);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to invite");
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Invite User</h2>
          <X onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>
        <form onSubmit={handleSubmit}>
          <Input placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} />
          <Select onChange={e => setFormData({...formData, role: e.target.value})}>
            {user.role === 'ADMIN' && <option value="OWNER">Shop Owner</option>}
            <option value="WORKER">Shop Worker</option>
          </Select>
          {formData.role === 'OWNER' && (
            <>
              <Input placeholder="Shop Name" required onChange={e => setFormData({...formData, shopName: e.target.value})} />
              <Input placeholder="Shop Address" onChange={e => setFormData({...formData, address: e.target.value})} />
            </>
          )}
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' }}>
            Send Invitation
          </button>
        </form>
      </Modal>
    </Overlay>
  );
};

export default CreateUserModal;