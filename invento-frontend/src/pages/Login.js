import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <GridOverlay />
      <BackgroundBlob className="blob-1" />
      <BackgroundBlob className="blob-2" />

      <GlassCard
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeaderArea>
          <motion.div 
            className="logo-glow"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5] 
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.img 
            src="/logo.png" 
            alt="Invento Logo" 
            className="logo-img"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to manage your inventory</p>
        </HeaderArea>

        <form onSubmit={handleSubmit}>
          <InputGroup>
            <label><Mail size={14} /> Email Address</label>
            <div className="input-wrap">
              <input 
                type="email" 
                placeholder="yourname@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </InputGroup>

          <InputGroup>
            <label><Lock size={14} /> Password</label>
            <div className="input-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </InputGroup>

          <AnimatePresence>
            {error && (
              <ErrorMessage 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
              >
                {error}
              </ErrorMessage>
            )}
          </AnimatePresence>

          <SubmitButton 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="spin" size={20} />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </SubmitButton>
        </form>

        <FooterText>
          <ShieldCheck size={12} /> Secure Connection Active
        </FooterText>
      </GlassCard>
    </PageContainer>
  );
};

export default Login;

// --- STYLES ---

const PageContainer = styled.div`
  height: 100vh; 
  width: 100vw; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background: #02060A; 
  overflow: hidden; 
  position: relative; 
  padding: 20px;
`;

const GridOverlay = styled.div`
  position: absolute; 
  inset: 0; 
  background-image: linear-gradient(rgba(0, 123, 255, 0.03) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(0, 123, 255, 0.03) 1px, transparent 1px); 
  background-size: 50px 50px;
`;

const BackgroundBlob = styled.div`
  position: absolute; 
  width: 500px; 
  height: 500px; 
  filter: blur(100px); 
  opacity: 0.2; 
  &.blob-1 { top: -10%; right: -10%; background: #007BFF; } 
  &.blob-2 { bottom: -10%; left: -10%; background: #00E676; }
`;

const GlassCard = styled(motion.div)`
  background: rgba(13, 20, 30, 0.7); 
  backdrop-filter: blur(20px);  
  padding: 3rem; 
  border-radius: 32px; 
  border: 1px solid rgba(255, 255, 255, 0.08); 
  width: 100%; 
  max-width: 450px; 
  z-index: 10; 
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6); 
  
  @media (max-width: 480px) { 
    padding: 2.5rem 1.5rem; 
  }
`;

const HeaderArea = styled.div`
  position: relative; 
  text-align: center; 
  margin-bottom: 2.5rem;

  .logo-img {
    width: 120px; 
    height: auto; 
    position: relative; 
    z-index: 2;
    margin-bottom: 1.5rem;
  }

  h2 {
    color: #fff;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }

  .subtitle {
    margin-top: 0.5rem; 
    color: #94a3b8; 
    font-size: 0.9rem;
  }

  .logo-glow {
    position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
    width: 150px; height: 100px; background: radial-gradient(circle, rgba(0, 123, 255, 0.2) 0%, transparent 70%);
    filter: blur(20px); z-index: 1;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.25rem; 
  
  label { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    color: #94a3b8; 
    font-size: 0.85rem; 
    font-weight: 600; 
    margin-bottom: 8px; 
  } 
  
  .input-wrap { 
    position: relative; 
    input { 
      width: 100%; 
      padding: 14px 16px; 
      background: rgba(0, 0, 0, 0.2); 
      border: 1px solid rgba(255,255,255,0.1); 
      border-radius: 12px; 
      color: white; 
      font-size: 1rem; 
      transition: 0.2s; 
      
      &:focus { 
        border-color: #007BFF; 
        background: rgba(0, 123, 255, 0.03); 
        outline: none; 
      } 
    } 
    
    button { 
      position: absolute; 
      right: 12px; 
      top: 50%; 
      transform: translateY(-50%); 
      background: none; 
      border: none; 
      color: #64748b; 
      cursor: pointer; 
      display: flex;
      align-items: center;
      &:hover { color: #94a3b8; }
    } 
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%; 
  padding: 16px; 
  background: #007BFF; 
  color: white; 
  border: none; 
  border-radius: 14px; 
  font-weight: 700; 
  font-size: 1rem; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 10px; 
  margin-top: 1.5rem; 
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.2); 
  
  &:disabled { 
    opacity: 0.6; 
    cursor: not-allowed; 
  }

  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(239, 68, 68, 0.1); 
  color: #f87171; 
  padding: 12px; 
  border-radius: 10px; 
  border: 1px solid rgba(239, 68, 68, 0.2); 
  font-size: 0.85rem; 
  font-weight: 500; 
  margin-bottom: 1rem; 
  text-align: center;
`;

const FooterText = styled.div`
  margin-top: 2rem; 
  color: #64748b; 
  font-size: 0.75rem; 
  font-weight: 600; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
`;