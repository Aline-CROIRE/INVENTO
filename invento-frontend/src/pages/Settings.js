import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Lock, Store, Globe, 
  Save, RefreshCcw, CheckCircle, 
  AlertTriangle, Camera, Mail, Phone, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: '' }

  // --- FORM STATES ---
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+250 ',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [shopConfig, setShopConfig] = useState({
    shopName: 'Kimelia Fresh Market',
    location: 'Kigali, Rwanda'
  });

  // --- HANDLERS ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Logic: Only send updated profile fields
      const payload = { name: profile.name, phone: profile.phone };
      const res = await api.patch('/auth/update-profile', payload);
      
      // CRITICAL: Update global context so changes persist on refresh
      updateUser({
        name: res.data.user.name,
        phone: res.data.user.phone
      });
      
      showStatus('success', 'Profile identity synchronized.');
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Update failed.');
    } finally { setIsSaving(false); }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    if(security.newPassword !== security.confirmPassword) {
        return showStatus('error', 'New passwords do not match.');
    }
    setIsSaving(true);
    try {
      await api.patch('/auth/update-password', security);
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showStatus('success', 'Security credentials rotated.');
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Current password invalid.');
    } finally { setIsSaving(false); }
  };

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="main-header">
        <div className="title-area">
          <label className="access-label">System Preferences</label>
          <h1>Control Center</h1>
        </div>
        <AnimatePresence>
          {status && (
            <StatusToast 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                $type={status.type}
            >
              {status.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
              {status.msg}
            </StatusToast>
          )}
        </AnimatePresence>
      </header>

      <SettingsGrid>
        
        {/* --- LEFT: IDENTITY --- */}
        <section className="col">
          <SectionCard>
            <div className="card-head">
              <User size={20} color="#00B0FF" />
              <h3>Operator Identity</h3>
            </div>
            
            <ProfilePreview>
               <div className="avatar">
                  {profile.name ? profile.name[0].toUpperCase() : 'U'}
                  <button className="edit-img"><Camera size={14}/></button>
               </div>
               <div className="meta">
                  <strong>{profile.name || 'Operator'}</strong>
                  <span>{user?.role} Authority</span>
               </div>
            </ProfilePreview>

            <form onSubmit={handleProfileUpdate}>
              <InputGroup>
                <label>Legal Name</label>
                <div className="input-wrap">
                    <User size={16} />
                    <input 
                        placeholder="Your full name"
                        value={profile.name} 
                        onChange={e => setProfile({...profile, name: e.target.value})} 
                    />
                </div>
              </InputGroup>
              <InputGroup>
                <label>Email (Locked)</label>
                <div className="input-wrap disabled">
                    <Mail size={16} />
                    <input value={profile.email} disabled />
                </div>
              </InputGroup>
              <InputGroup>
                <label>Contact Phone</label>
                <div className="input-wrap">
                    <Phone size={16} />
                    <input 
                        value={profile.phone} 
                        onChange={e => setProfile({...profile, phone: e.target.value})} 
                    />
                </div>
              </InputGroup>
              <button className="save-btn" type="submit" disabled={isSaving}>
                {isSaving ? <RefreshCcw className="spin" size={18}/> : <><Save size={18}/> Save Identity</>}
              </button>
            </form>
          </SectionCard>
        </section>

        {/* --- RIGHT: SECURITY & SHOP --- */}
        <section className="col">
          
          <SectionCard>
            <div className="card-head">
              <Lock size={20} color="#f43f5e" />
              <h3>Security Protocol</h3>
            </div>
            <form onSubmit={handleSecurityUpdate}>
              <InputGroup>
                <label>Current Password</label>
                <input 
                    type="password" 
                    autoComplete="current-password"
                    value={security.currentPassword} 
                    onChange={e => setSecurity({...security, currentPassword: e.target.value})} 
                />
              </InputGroup>
              <div className="row-split">
                <InputGroup>
                  <label>New Passphrase</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    value={security.newPassword} 
                    onChange={e => setSecurity({...security, newPassword: e.target.value})} 
                  />
                </InputGroup>
                <InputGroup>
                  <label>Confirm New</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    value={security.confirmPassword} 
                    onChange={e => setSecurity({...security, confirmPassword: e.target.value})} 
                  />
                </InputGroup>
              </div>
              <button className="sec-btn" type="submit" disabled={isSaving}>Rotate Credentials</button>
            </form>
          </SectionCard>

          {user?.role === 'OWNER' && (
            <SectionCard className="shop-zone">
              <div className="card-head">
                <Store size={20} color="#00E676" />
                <h3>Enterprise Configuration</h3>
              </div>
              <InputGroup>
                <label>Shop Display Name</label>
                <div className="input-wrap">
                    <Store size={16}/>
                    <input value={shopConfig.shopName} onChange={e => setShopConfig({...shopConfig, shopName: e.target.value})} />
                </div>
              </InputGroup>
              <InputGroup>
                <label>HQ Physical Address</label>
                <div className="input-wrap">
                    <MapPin size={16}/>
                    <input value={shopConfig.location} onChange={e => setShopConfig({...shopConfig, location: e.target.value})} />
                </div>
              </InputGroup>
              <div className="info-alert">
                 <Globe size={14}/>
                 <span>Currency: <strong>Rwandan Franc (Rwf)</strong></span>
              </div>
            </SectionCard>
          )}

        </section>
      </SettingsGrid>
    </PageWrapper>
  );
};

// --- STYLES ---

const PageWrapper = styled(motion.div)`
  max-width: 1440px; margin: 0 auto; padding-bottom: 50px;
  .main-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; 
    .access-label { display: block; font-size: 0.7rem; font-weight: 800; color: #00B0FF; letter-spacing: 2px; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: white; }
  }
`;

const StatusToast = styled(motion.div)`
  background: ${p => p.$type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(244, 63, 94, 0.1)'};
  border: 1px solid ${p => p.$type === 'success' ? '#00E67640' : '#f43f5e40'};
  color: ${p => p.$type === 'success' ? '#00E676' : '#f43f5e'};
  padding: 12px 20px; border-radius: 50px; display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.85rem;
`;

const SettingsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

const SectionCard = styled.div`
  background: rgba(13, 31, 45, 0.4); backdrop-filter: blur(20px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); padding: 2.5rem;
  @media (max-width: 768px) { padding: 1.5rem; }
  .card-head { display: flex; align-items: center; gap: 15px; margin-bottom: 1.5rem; h3 { font-size: 1.2rem; color: white; margin: 0; font-weight: 900; } }
  .row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; @media (max-width: 600px) { grid-template-columns: 1fr; } }
  .info-alert { margin-top: 2rem; background: rgba(0, 176, 255, 0.05); padding: 12px 20px; border-radius: 15px; border-left: 3px solid #00B0FF; color: #94a3b8; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; }
  
  .save-btn { width: 100%; margin-top: 2.5rem; background: linear-gradient(135deg, #00B0FF 0%, #007BFF 100%); color: white; border: none; padding: 16px; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0, 176, 255, 0.3); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
  .sec-btn { width: 100%; margin-top: 1.5rem; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #f43f5e; padding: 14px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; &:hover { background: #f43f5e; color: white; } }
`;

const ProfilePreview = styled.div`
  display: flex; align-items: center; gap: 20px; margin-bottom: 2.5rem; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.03);
  .avatar { width: 65px; height: 65px; background: linear-gradient(135deg, #00B0FF, #00E676); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; color: white; position: relative; 
    .edit-img { position: absolute; bottom: -5px; right: -5px; width: 24px; height: 24px; border-radius: 50%; background: white; border: none; color: #04090E; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  }
  .meta { strong { display: block; font-size: 1rem; color: white; } span { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; } }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  label { display: block; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  .input-wrap { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); padding: 0 16px; border-radius: 14px; transition: 0.3s;
    &:focus-within { border-color: #00B0FF; background: rgba(0, 176, 255, 0.05); }
    svg { color: #475569; }
    input { background: none; border: none; padding: 14px 0; width: 100%; color: white; font-weight: 600; outline: none; font-size: 0.9rem; }
    &.disabled { opacity: 0.4; cursor: not-allowed; }
  }
  input[type="password"] { 
    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 14px; width: 100%; outline: none; color: white;
    &:focus { border-color: #f43f5e; }
  }
`;

export default Settings;