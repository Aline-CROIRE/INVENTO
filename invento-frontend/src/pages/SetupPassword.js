import React, { useState } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Loader } from 'lucide-react';
import api from '../api/axios';

const Container = styled.div`
  height: 100vh; display: flex; justify-content: center; align-items: center; background: #04090E;
`;

const Card = styled.div`
  background: #0D1F2D; padding: 3rem; border-radius: 24px; width: 100%; max-width: 400px;
  border: 1px solid rgba(255,255,255,0.1); text-align: center;
`;

const Input = styled.input`
  width: 100%; padding: 14px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white;
  margin: 1.5rem 0; outline: none; &:focus { border-color: #007BFF; }
`;

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/setup-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      alert('This link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        {!success ? (
          <>
            <Lock size={48} color="#007BFF" style={{ marginBottom: '1rem' }} />
            <h2>Set Your Password</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Create a password to activate your account.</p>
            <form onSubmit={handleSetup}>
              <Input 
                type="password" placeholder="Min 6 characters" required minLength="6"
                onChange={e => setPassword(e.target.value)} 
              />
              <button disabled={loading} style={{ width: '100%', background: '#007BFF', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                {loading ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
          </>
        ) : (
          <>
            <CheckCircle size={48} color="#28A745" style={{ marginBottom: '1rem' }} />
            <h2>Success!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Your account is now active. Redirecting...</p>
          </>
        )}
      </Card>
    </Container>
  );
};

export default SetupPassword;