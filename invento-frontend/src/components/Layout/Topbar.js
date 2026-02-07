import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { 
  Search, Bell, User, Shield, LogOut, 
  Settings, Activity, AlertTriangle, 
  CheckCircle, AlertCircle, Check, Trash2,
  Clock, Wifi, Globe, Command, X, Box, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // --- 1. SYSTEM PULSE (Status & Time) ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const checkStatus = async () => {
      try {
        await api.get('/auth/status');
        setIsOnline(true);
      } catch (e) { setIsOnline(false); }
    };
    checkStatus();
    const statusInterval = setInterval(checkStatus, 30000); // 30s heartbeat
    return () => { clearInterval(timer); clearInterval(statusInterval); };
  }, []);

  // --- 2. MULTI-VECTOR NOTIFICATION ENGINE ---
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/inventory');
      // res.data structure depends on your backend logic
      const products = res.data.products || (Array.isArray(res.data) ? res.data : []);
      const batches = res.data.batches || [];

      const newAlerts = [];
      const today = new Date();
      const fifteenDaysOut = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

      // Vector 1: Stock levels
      products.forEach(p => {
        if (p.totalStock === 0) {
          newAlerts.push({
            id: `stock-out-${p._id}`,
            title: 'Stock Depleted',
            msg: `${p.name} is completely out of stock.`,
            type: 'critical', icon: <Box size={14}/>, isRead: false
          });
        } else if (p.totalStock <= p.minStockLevel) {
          newAlerts.push({
            id: `low-stock-${p._id}`,
            title: 'Low Threshold',
            msg: `${p.name} at ${p.totalStock} ${p.unit}.`,
            type: 'warning', icon: <AlertTriangle size={14}/>, isRead: false
          });
        }
      });

      // Vector 2: Expiration (Sustainability Link)
      batches.forEach(b => {
        const expDate = new Date(b.expiryDate);
        if (expDate < today && b.quantity > 0) {
          newAlerts.push({
            id: `exp-expired-${b._id}`,
            title: 'Capital Leakage',
            msg: `Batch ${b.batchNumber} has expired.`,
            type: 'critical', icon: <AlertCircle size={14}/>, isRead: false
          });
        } else if (expDate < fifteenDaysOut && b.quantity > 0) {
          newAlerts.push({
            id: `exp-soon-${b._id}`,
            title: 'Expiring Soon',
            msg: `Stock expiring by ${expDate.toLocaleDateString()}.`,
            type: 'warning', icon: <Calendar size={14}/>, isRead: false
          });
        }
      });

      // Hybrid Fallback: If no real-time database hits, show info status
      if (newAlerts.length === 0) {
        setNotifications([
          { id: 'sys-1', title: 'Neural Link Optimal', msg: 'All system nodes reporting 100% health.', type: 'info', icon: <Globe size={14}/>, isRead: false }
        ]);
      } else {
        setNotifications(newAlerts);
      }
    } catch (e) {
      console.warn("Notification sync interrupted.");
    }
  }, []);

  useEffect(() => { 
    fetchAlerts(); 
    const polling = setInterval(fetchAlerts, 120000); // Polling every 2 mins
    return () => clearInterval(polling);
  }, [fetchAlerts]);

  // --- ACTIONS ---
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <TopBarWrapper>
      {/* LEFT: COMMAND SEARCH (Responsive Overlay) */}
      <SearchHUD $expanded={isSearchExpanded}>
        <div className="search-pill">
          <Search size={18} className="icon-main" onClick={() => setIsSearchExpanded(true)} />
          <input 
            placeholder="Command Search (Assets, Sales, Logs)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchExpanded(true)}
            onBlur={() => !searchQuery && setIsSearchExpanded(false)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    navigate(`/inventory?search=${searchQuery}`);
                    setIsSearchExpanded(false);
                }
            }}
          />
          {isSearchExpanded && <X size={16} className="close-btn" onClick={() => {setIsSearchExpanded(false); setSearchQuery("");}} />}
        </div>
      </SearchHUD>

      {/* CENTER: CHRONOS HUD (Desktop Only) */}
      <SystemHUD className="desktop-only">
        <div className="hud-bit">
          <Clock size={14} color="#00B0FF" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <div className="divider" />
        <div className="hud-bit">
           <Wifi size={14} color={isOnline ? "#00E676" : "#f43f5e"} />
           <span className={isOnline ? "active" : "failed"}>{isOnline ? "SYNC STABLE" : "SYNC LOST"}</span>
        </div>
      </SystemHUD>

      {/* RIGHT: NOTIFICATIONS & PROFILE */}
      <ActionHUD>
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <NotifyButton onClick={() => setShowNotifications(!showNotifications)} $hasUnread={unreadCount > 0}>
            <Bell size={20} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="unread-badge">
                    {unreadCount}
                </motion.div>
              )}
            </AnimatePresence>
          </NotifyButton>
          
          <AnimatePresence>
            {showNotifications && (
              <NotifDropdown initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <div className="drop-head">
                   <h3>Signal Stream</h3>
                   <button onClick={clearAll} className="clear-link">FLUSH</button>
                </div>
                
                <div className="stream-scroll">
                  {notifications.map(n => (
                    <SignalItem key={n.id} $type={n.type} $isRead={n.isRead}>
                      <div className="type-indicator" />
                      <div className="signal-content">
                        <div className="sig-top">
                            <strong>{n.title}</strong>
                            {n.icon}
                        </div>
                        <p>{n.msg}</p>
                      </div>
                      {!n.isRead && <button onClick={() => markAsRead(n.id)} className="check-btn"><Check size={12}/></button>}
                    </SignalItem>
                  ))}
                </div>
              </NotifDropdown>
            )}
          </AnimatePresence>
        </div>

        <DividerV />

        <div style={{ position: 'relative' }} ref={profileRef}>
          <ProfileTrigger onClick={() => setShowProfile(!showProfile)}>
            <div className="meta-text desktop-only">
               <strong>{user?.name || 'Operator'}</strong>
               <label>{user?.role} NODE</label>
            </div>
            <div className="avatar-hex">
              {user?.role === 'OWNER' ? <Shield size={18} /> : <User size={18} />}
              <div className="ping-dot" />
            </div>
          </ProfileTrigger>

          <AnimatePresence>
            {showProfile && (
              <ProfileDropdown initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <div className="profile-header">
                   <small>Identity Verified</small>
                   <strong>{user?.email}</strong>
                </div>
                <MenuAction onClick={() => navigate('/settings')}><Settings size={14}/> Node Settings</MenuAction>
                <MenuAction className="logout" onClick={logout}><LogOut size={14}/> System Sign-out</MenuAction>
              </ProfileDropdown>
            )}
          </AnimatePresence>
        </div>
      </ActionHUD>
    </TopBarWrapper>
  );
};

// --- STYLES ---

const TopBarWrapper = styled.header`
  height: 80px; background: rgba(4, 8, 15, 0.7); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex;
  align-items: center; justify-content: space-between; padding: 0 2rem;
  position: sticky; top: 0; z-index: 1000;
  @media (max-width: 768px) { padding: 0 1rem; height: 75px; }
`;

const SearchHUD = styled.div`
  flex: 1; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: ${p => p.$expanded ? '450px' : '260px'};
  
  @media (max-width: 1024px) {
    position: ${p => p.$expanded ? 'absolute' : 'relative'};
    left: ${p => p.$expanded ? '0' : 'unset'};
    width: ${p => p.$expanded ? '100%' : '44px'};
    max-width: ${p => p.$expanded ? '100%' : '44px'};
    z-index: 10;
  }

  .search-pill {
    height: 44px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; display: flex; align-items: center; padding: 0 12px; gap: 10px;
    
    .icon-main { color: #64748b; cursor: pointer; transition: 0.3s; &:hover { color: #007BFF; } }
    
    input { background: none; border: none; color: white; width: 100%; outline: none; font-size: 0.9rem; font-weight: 600;
      &::placeholder { color: #475569; }
      @media (max-width: 1024px) { display: ${p => p.$expanded ? 'block' : 'none'}; }
    }
    .close-btn { color: #f43f5e; cursor: pointer; }
    
    &:focus-within { border-color: #007BFF; background: rgba(0, 123, 255, 0.05); }
  }
`;

const SystemHUD = styled.div`
  display: flex; align-items: center; gap: 20px; flex: 1; justify-content: center;
  &.desktop-only { @media (max-width: 1100px) { display: none; } }
  
  .hud-bit { display: flex; align-items: center; gap: 10px; 
    span { font-size: 0.75rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #94a3b8; 
      &.active { color: #00E676; text-shadow: 0 0 10px rgba(0, 230, 118, 0.3); }
      &.failed { color: #f43f5e; } } }
  .divider { width: 1px; height: 25px; background: rgba(255,255,255,0.08); }
`;

const ActionHUD = styled.div` display: flex; align-items: center; gap: 1rem; `;

const NotifyButton = styled.button`
  background: none; border: none; color: #64748b; cursor: pointer; position: relative;
  width: 44px; height: 44px; border-radius: 12px; transition: 0.3s;
  &:hover { color: white; background: rgba(255,255,255,0.04); }
  
  .unread-badge {
    position: absolute; top: 8px; right: 8px; width: 18px; height: 18px;
    background: #007BFF; color: white; font-size: 0.6rem; font-weight: 900;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2px solid #04080F; box-shadow: 0 0 10px #007BFF;
  }
`;

const NotifDropdown = styled(motion.div)`
  position: absolute; top: 65px; right: 0; width: 340px; background: #0D141C;
  border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.6); padding: 1.5rem; z-index: 1100;
  @media (max-width: 480px) { width: 85vw; right: -50px; }

  .drop-head { display: flex; justify-content: space-between; margin-bottom: 1.5rem;
    h3 { font-size: 0.9rem; font-weight: 900; margin: 0; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .clear-link { background: none; border: none; color: #f43f5e; font-size: 0.65rem; font-weight: 900; cursor: pointer; } }
  
  .stream-scroll { max-height: 380px; overflow-y: auto; &::-webkit-scrollbar { width: 0; } }
`;

const SignalItem = styled.div`
  display: flex; gap: 12px; padding: 12px; border-radius: 14px; position: relative; margin-bottom: 10px;
  background: ${p => p.$isRead ? 'transparent' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$isRead ? 'transparent' : 'rgba(255,255,255,0.05)'};
  opacity: ${p => p.$isRead ? 0.6 : 1};

  .type-indicator { width: 4px; height: 35px; border-radius: 10px; background: ${p => p.$type === 'critical' ? '#f43f5e' : p.$type === 'warning' ? '#FF9100' : '#00B0FF'}; }
  .signal-content { flex: 1; 
    .sig-top { display: flex; justify-content: space-between; color: white; margin-bottom: 4px; 
      strong { font-size: 0.85rem; } }
    p { font-size: 0.75rem; color: #94a3b8; margin: 0; line-height: 1.4; } }
  .check-btn { background: none; border: none; color: #00E676; cursor: pointer; }
`;

const ProfileTrigger = styled.div`
  display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px; border-radius: 14px;
  &:hover { background: rgba(255,255,255,0.03); }

  .meta-text { text-align: right; 
    strong { display: block; font-size: 0.85rem; color: #f8fafc; }
    label { font-size: 0.6rem; font-weight: 900; color: #475569; text-transform: uppercase; } }
  
  .avatar-hex {
    width: 44px; height: 44px; background: #0D141C; border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #00B0FF; position: relative;
    .ping-dot { position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; background: #00E676; border: 2px solid #04080F; border-radius: 50%; box-shadow: 0 0 10px #00E676; } }
`;

const ProfileDropdown = styled(NotifDropdown)`
  width: 260px;
  .profile-header { padding: 10px 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;
    small { display: block; font-size: 0.65rem; color: #00E676; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
    strong { font-size: 0.85rem; color: white; } }
`;

const MenuAction = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; 
  color: #94a3b8; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s;
  &:hover { background: rgba(255,255,255,0.04); color: white; }
  &.logout { color: #f43f5e; &:hover { background: rgba(244,63,94,0.05); } }
`;

const DividerV = styled.div` width: 1px; height: 35px; background: rgba(255,255,255,0.05); `;

export default TopBar;