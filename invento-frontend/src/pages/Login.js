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
      setError('Access Denied. Node Authentication Failed.');
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
        <HeroLogoArea>
          <motion.div 
            className="main-logo-glow"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5] 
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.img 
            src="/logo.png" 
            alt="Invento" 
            className="hero-logo"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          <p className="terminal-id">Intelligence System Terminal v4.0</p>
        </HeroLogoArea>

        <form onSubmit={handleSubmit}>
          <InputGroup>
            <label><Mail size={14} /> Node Identity</label>
            <div className="input-wrap">
              <input 
                type="email" 
                placeholder="operator@system.io" 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </InputGroup>

          <InputGroup>
            <label><Lock size={14} /> Security Key</label>
            <div className="input-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
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
              <ErrorMessage initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {error}
              </ErrorMessage>
            )}
          </AnimatePresence>

          <SubmitButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : <>Initialize Session <ArrowRight size={18} /></>}
          </SubmitButton>
        </form>

        <FooterText><ShieldCheck size={12} /> Secure Auth-Protocol Active</FooterText>
      </GlassCard>
    </PageContainer>
  );
};

export default Login;

// --- STYLES ---

const PageContainer = styled.div`
  height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center;
  background: #02060A; overflow: hidden; position: relative; padding: 20px;
`;

const GridOverlay = styled.div`
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(0, 123, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 123, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
`;

const BackgroundBlob = styled.div`
  position: absolute; width: 500px; height: 500px; filter: blur(100px); opacity: 0.3;
  &.blob-1 { top: -10%; right: -10%; background: #007BFF; }
  &.blob-2 { bottom: -10%; left: -10%; background: #00E676; }
`;

const GlassCard = styled(motion.div)`
  background: rgba(13, 20, 30, 0.6); backdrop-filter: blur(20px); 
  padding: 3rem; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%; max-width: 460px; z-index: 10; box-shadow: 0 50px 100px rgba(0, 0, 0, 0.8);
  @media (max-width: 480px) { padding: 2rem 1.5rem; }
`;

const HeroLogoArea = styled.div`
  position: relative; text-align: center; margin-bottom: 3rem;
  
  .hero-logo {
    width: 200px; height: auto; position: relative; z-index: 2;
    filter: drop-shadow(0 0 15px rgba(0, 123, 255, 0.4));
    @media (max-width: 480px) { width: 160px; }
  }

  .main-logo-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 220px; height: 120px; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    filter: blur(20px); z-index: 1;
  }

  .terminal-id {
    margin-top: 1.5rem; color: #475569; font-size: 0.7rem; font-weight: 800; letter-spacing: 3px; text-transform: uppercase;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  label { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
  .input-wrap {
    position: relative;
    input {
      width: 100%; padding: 16px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px; color: white; font-size: 1rem; transition: 0.3s;
      &:focus { border-color: #007BFF; background: rgba(0, 123, 255, 0.05); outline: none; }
    }
    button { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #475569; cursor: pointer; }
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%; padding: 18px; background: #007BFF; color: white; border: none; border-radius: 18px;
  font-weight: 900; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-top: 1rem; box-shadow: 0 10px 20px rgba(0, 123, 255, 0.3);
  &:disabled { opacity: 0.5; }
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; text-align: center;
`;

const FooterText = styled.div`
  margin-top: 2rem; color: #475569; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
  display: flex; align-items: center; justify-content: center; gap: 8px;
`;