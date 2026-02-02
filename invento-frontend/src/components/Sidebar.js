import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Nav = styled.nav`
  width: 260px; height: 100vh; background: rgba(13, 31, 45, 0.8);
  backdrop-filter: blur(10px); border-right: 1px solid rgba(255,255,255,0.1);
  padding: 2rem; display: flex; flex-direction: column;
`;

const Logo = styled.h1`
  font-size: 1.5rem; font-weight: 800; background: linear-gradient(to right, #28A745, #007BFF);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 3rem;
`;

const NavLink = styled.div`
  padding: 12px 15px; border-radius: 10px; margin-bottom: 10px;
  color: rgba(255,255,255,0.7); cursor: pointer;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
  ${props => props.active && 'background: var(--blue); color: white;'}
`;

const Sidebar = () => {
  const { logout } = useAuth();
  return (
    <Nav>
      <Logo>INVENTO</Logo>
      <NavLink active>Dashboard</NavLink>
      <NavLink>Inventory</NavLink>
      <NavLink>Sales</NavLink>
      <NavLink>Sustainability</NavLink>
      <div style={{ marginTop: 'auto' }}>
        <NavLink onClick={logout}>Logout</NavLink>
      </div>
    </Nav>
  );
};

export default Sidebar;