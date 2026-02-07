import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, CheckCircle, Clock, Mail, RefreshCcw, Trash2, 
  Edit3, Power, XCircle, Users as UsersIcon, Shield, 
  Search, Database, Radio, Loader, Activity, UserCheck, 
  ChevronRight, MoreVertical, ShieldAlert
} from 'lucide-react';
import api from '../api/axios';
import CreateUserModal from '../components/Users/CreateUserModal';

export default function Users() {
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 1. SIMULATION DATA ---
  const USERS_BASELINE = useMemo(() => [
    { _id: "B1", name: "Jean Pierre", email: "admin@invento.rw", role: "ADMIN", status: "ACTIVE", lastSeen: "2m ago" },
    { _id: "B2", name: "Marie Louise", email: "owner@kigalishop.rw", role: "OWNER", status: "ACTIVE", lastSeen: "1h ago" },
    { _id: "B3", name: "Eric Munya", email: "eric@staff.rw", role: "WORKER", status: "PENDING", lastSeen: "Never" },
    { _id: "B4", name: "Alice Umutoni", email: "alice@staff.rw", role: "WORKER", status: "DEACTIVATED", lastSeen: "3d ago" },
  ], []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setUsers(USERS_BASELINE);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setUsers(USERS_BASELINE); // Fallback to demo if API fails
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }, [isDemoMode, USERS_BASELINE]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // --- 2. LOGIC ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => ({
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.status === 'ACTIVE').length,
    admins: filteredUsers.filter(u => u.role === 'ADMIN').length
  }), [filteredUsers]);

  const handleDelete = async (id) => {
    if (isDemoMode) return;
    if (window.confirm("Permanently remove this person from the system?")) {
      await api.delete(`/users/${id}`);
      fetchUsers();
    }
  };

  const handleToggleStatus = async (id) => {
    if (isDemoMode) return;
    await api.patch(`/users/${id}/status`);
    fetchUsers();
  };

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* --- HEADER --- */}
      <HeaderSection>
        <div className="brand-group">
            <div className="logo-hex">
                <img src="/logo.png" alt="Logo" />
            </div>
            <div className="title-text">
                <div className="mode-pill" onClick={() => setIsDemoMode(!isDemoMode)}>
                   <div className={`dot ${isDemoMode ? 'sim' : 'live'}`} />
                   {isDemoMode ? 'VIEWING DEMO' : 'LIVE SYSTEM'}
                </div>
                <h1>Team <span>Management</span></h1>
            </div>
        </div>

        <TopActions>
            <div className="search-pill">
                <Search size={18} color="#64748b"/>
                <input 
                  placeholder="Find someone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                <UserPlus size={20}/> <span>Invite Member</span>
            </button>
        </TopActions>
      </HeaderSection>

      {/* --- QUICK STATS --- */}
      <MetricsGrid>
        <MCard $color="#00B0FF">
            <div className="m-icon"><UsersIcon size={20}/></div>
            <div className="m-info"><label>Total People</label><h3>{stats.total}</h3></div>
        </MCard>
        <MCard $color="#00E676">
            <div className="m-icon"><UserCheck size={20}/></div>
            <div className="m-info"><label>Active Now</label><h3>{stats.active}</h3></div>
        </MCard>
        <MCard $color="#885AF8">
            <div className="m-icon"><Shield size={20}/></div>
            <div className="m-info"><label>Administrators</label><h3>{stats.admins}</h3></div>
        </MCard>
      </MetricsGrid>

      {/* --- DATA VIEW --- */}
      <DataViewport>
        <ControlBar>
            <h3>Access Directory</h3>
            <button className="refresh-btn" onClick={fetchUsers}>
                <RefreshCcw size={16} className={loading ? 'spin' : ''}/>
            </button>
        </ControlBar>

        {/* DESKTOP VIEW */}
        <table className="desktop-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Account Level</th>
              <th>Status</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode='wait'>
              {loading ? (
                <tr><td colSpan="4" align="center" style={{padding: '5rem'}}><Loader className="spin" color="#00B0FF"/></td></tr>
              ) : filteredUsers.map((u) => (
                <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>
                    <div className="user-cell">
                        <div className="avatar">{u.name?.charAt(0) || 'U'}</div>
                        <div className="u-info"><strong>{u.name || "New User"}</strong><span>{u.email}</span></div>
                    </div>
                  </td>
                  <td><RoleBadge $role={u.role}>{u.role === 'ADMIN' ? 'Administrator' : u.role === 'OWNER' ? 'Manager' : 'Staff'}</RoleBadge></td>
                  <td>
                    <StatusTag $state={u.status}>
                      {u.status === 'ACTIVE' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {u.status === 'DEACTIVATED' ? 'Suspended' : u.status}
                    </StatusTag>
                  </td>
                  <td align="right">
                    <div className="action-row">
                      <ActionBtn><Edit3 size={16}/></ActionBtn>
                      <ActionBtn 
                        $color={u.status === 'DEACTIVATED' ? '#00E676' : '#FF9100'} 
                        onClick={() => handleToggleStatus(u._id)}
                      >
                        <Power size={16}/>
                      </ActionBtn>
                      <ActionBtn className="del" onClick={() => handleDelete(u._id)}><Trash2 size={16}/></ActionBtn>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* MOBILE VIEW */}
        <div className="mobile-view">
            {filteredUsers.map(u => (
              <div className="m-card" key={u._id}>
                <div className="m-head">
                    <div className="m-user">
                        <div className="avatar">{u.name?.charAt(0) || 'U'}</div>
                        <div>
                            <strong>{u.name || "User"}</strong>
                            <RoleBadge $role={u.role}>{u.role}</RoleBadge>
                        </div>
                    </div>
                    <StatusTag $state={u.status}>{u.status === 'DEACTIVATED' ? 'OFF' : 'ON'}</StatusTag>
                </div>
                <div className="m-body">
                   <p><Mail size={14}/> {u.email}</p>
                </div>
                <div className="m-foot">
                    <button onClick={() => handleToggleStatus(u._id)}>{u.status === 'DEACTIVATED' ? 'Unlock' : 'Lock'}</button>
                    <button onClick={() => handleDelete(u._id)} className="del">Delete</button>
                </div>
              </div>
            ))}
        </div>
      </DataViewport>

      {isModalOpen && <CreateUserModal onClose={() => { setIsModalOpen(false); fetchUsers(); }} />}
    </PageWrapper>
  );
}

// --- STYLED COMPONENTS ---

const PageWrapper = styled(motion.div)`
  max-width: 1400px; margin: 0 auto; padding: 1.5rem; color: #fff; background: #04080F; min-height: 100vh;
`;

const HeaderSection = styled.header`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1.5rem;
  .brand-group { display: flex; align-items: center; gap: 1.2rem;
    .logo-hex { width: 50px; height: 50px; background: white; border-radius: 15px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(255,255,255,0.1); img { width: 100%; object-fit: contain; } }
    .title-text {
      .mode-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 5px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 800; color: #94a3b8; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 4px;
        .dot { width: 6px; height: 6px; border-radius: 50%; &.live { background: #00E676; } &.sim { background: #FF9100; } } }
      h1 { margin: 0; font-size: 1.8rem; font-weight: 900; span { color: #00B0FF; } } } }
`;

const TopActions = styled.div`
  display: flex; gap: 1rem; align-items: center;
  .search-pill { background: #0D1F2D; border: 1px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 0 1rem; display: flex; align-items: center;
    input { background: none; border: none; padding: 10px 0; color: white; outline: none; width: 180px; font-size: 0.9rem; } }
  .add-btn { background: #00B0FF; color: white; border: none; padding: 10px 20px; border-radius: 50px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0, 123, 255, 0.3); } }
  @media (max-width: 768px) { width: 100%; .search-pill { flex: 1; } .add-btn span { display: none; } }
`;

const MetricsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 3rem;
`;

const MCard = styled.div`
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.2rem; border-radius: 20px; display: flex; align-items: center; gap: 1rem; border-left: 4px solid ${p => p.$color};
  .m-icon { color: ${p => p.$color}; }
  .m-info { label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; } h3 { margin: 0; font-size: 1.3rem; } }
`;

const DataViewport = styled.div`
  background: rgba(13, 31, 45, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 25px; overflow: hidden;
  .desktop-table { width: 100%; border-collapse: collapse; @media (max-width: 900px) { display: none; }
    th { text-align: left; padding: 1.2rem; font-size: 0.7rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); }
    td { padding: 1rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.02); 
      .user-cell { display: flex; align-items: center; gap: 12px; 
        .avatar { width: 35px; height: 35px; background: #0D1F2D; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #00B0FF; border: 1px solid rgba(0, 176, 255, 0.1); }
        .u-info { display: flex; flex-direction: column; strong { font-size: 0.9rem; } span { font-size: 0.75rem; color: #64748b; } } }
      .action-row { display: flex; gap: 8px; justify-content: flex-end; } } }
  .mobile-view { display: none; flex-direction: column; gap: 1rem; padding: 1rem; @media (max-width: 900px) { display: flex; }
    .m-card { background: #0D1F2D; border-radius: 15px; padding: 1.2rem; border: 1px solid rgba(255,255,255,0.05);
      .m-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; .m-user { display: flex; align-items: center; gap: 10px; .avatar { width: 30px; height: 30px; background: #1a2e3f; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; } } }
      .m-body { font-size: 0.8rem; color: #94a3b8; p { display: flex; align-items: center; gap: 8px; margin: 0; } }
      .m-foot { display: flex; gap: 10px; margin-top: 1rem; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.03); 
        button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: none; color: white; font-size: 0.75rem; font-weight: 700; &.del { color: #f43f5e; } } } } }
`;

const ControlBar = styled.div`
  padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);
  h3 { margin: 0; font-size: 0.9rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
  .refresh-btn { background: none; border: none; color: #64748b; cursor: pointer; &.spin { animation: spin 1s linear infinite; } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const RoleBadge = styled.span`
  background: ${p => p.$role === 'ADMIN' ? '#00B0FF15' : p.$role === 'OWNER' ? '#885AF815' : '#00E67615'};
  color: ${p => p.$role === 'ADMIN' ? '#00B0FF' : p.$role === 'OWNER' ? '#885AF8' : '#00E676'};
  padding: 3px 10px; border-radius: 50px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; border: 1px solid currentColor;
`;

const StatusTag = styled.div`
  display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
  color: ${p => p.$state === 'ACTIVE' ? '#00E676' : p.$state === 'PENDING' ? '#FF9100' : '#f43f5e'};
`;

const ActionBtn = styled.button`
  background: rgba(255,255,255,0.03); border: none; color: ${p => p.$color || '#94a3b8'}; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: ${p => p.$color || '#00B0FF'}; color: #fff; }
  &.del:hover { background: #f43f5e; }
`;