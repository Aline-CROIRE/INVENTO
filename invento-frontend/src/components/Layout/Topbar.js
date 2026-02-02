import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';

const Header = styled.header`
  height: 70px; background: rgba(4, 9, 14, 0.8); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; position: sticky; top: 0; z-index: 10;
`;

const UserProfile = styled.div`
  display: flex; align-items: center; gap: 12px;
`;

const RoleBadge = styled.span`
  background: ${props => props.role === 'ADMIN' ? '#007BFF' : '#28A745'};
  padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: bold;
`;

const TopBar = () => {
  const { user } = useAuth();
  return (
    <Header>
      <div style={{ fontWeight: 'bold' }}>Welcome, {user?.email.split('@')[0]}</div>
      <UserProfile>
        <RoleBadge role={user?.role}>{user?.role}</RoleBadge>
        <div style={{ width: 35, height: 35, borderRadius: '50%', background: '#333' }} />
      </UserProfile>
    </Header>
  );
};

export default TopBar;