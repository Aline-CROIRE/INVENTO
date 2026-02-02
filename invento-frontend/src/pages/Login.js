import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top right, var(--green), transparent),
              radial-gradient(circle at bottom left, var(--blue), transparent);
`;

const GlassCard = styled.div`
  background: var(--glass);
  backdrop-filter: blur(15px);
  padding: 3rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: var(--green);
  color: white;
  font-weight: bold;
  border-radius: 8px;
  margin-top: 10px;
  &:hover { background: #218838; }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert('Login Failed');
    }
  };

  return (
    <Container>
      <GlassCard>
        <h2>Invento</h2>
        <p>Intelligence System</p>
        <form onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
          <Button type="submit">Login</Button>
        </form>
      </GlassCard>
    </Container>
  );
};

export default Login;