import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Leaf, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SidebarContainer = styled.aside`
  width: 260px; height: 100vh; background: #0D1F2D;
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column; position: fixed; left: 0; top: 0; z-index: 100;
`;

const LogoSection = styled.div`
  padding: 2.5rem 2rem; font-size: 1.8rem; font-weight: 900;
  letter-spacing: -1px; color: #28A745;
  span { color: #007BFF; }
`;

const NavMenu = styled.nav` flex: 1; padding: 0 1rem; `;

const StyledNavLink = styled(NavLink)`
  display: flex; align-items: center; gap: 14px; padding: 14px 1.2rem;
  color: rgba(255,255,255,0.5); text-decoration: none; border-radius: 12px;
  margin-bottom: 8px; font-weight: 500; transition: all 0.3s ease;

  &.active { background: #007BFF; color: white; box-shadow: 0 4px 15px rgba(0,123,255,0.3); }
  &:hover:not(.active) { background: rgba(255,255,255,0.05); color: white; }
`;

const LogoutBtn = styled.button`
  margin: 2rem 1rem; padding: 14px; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: rgba(255,140,66,0.1); color: #FF8C42; border: 1px solid rgba(255,140,66,0.2);
  border-radius: 12px; font-weight: 600; 
  &:hover { background: #FF8C42; color: white; }
`;

const Sidebar = () => {
  const { user, logout } = useAuth();
  const menu = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={22}/>, roles: ['ADMIN', 'OWNER', 'WORKER'] },
    { name: 'Inventory', path: '/inventory', icon: <Package size={22}/>, roles: ['OWNER', 'WORKER'] },
    { name: 'Sales', path: '/sales', icon: <ShoppingCart size={22}/>, roles: ['OWNER', 'WORKER'] },
    { name: 'Users', path: '/users', icon: <Users size={22}/>, roles: ['ADMIN', 'OWNER'] },
    { name: 'Sustainability', path: '/sustainability', icon: <Leaf size={22}/>, roles: ['OWNER'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={22}/>, roles: ['ADMIN', 'OWNER', 'WORKER'] },
  ];

  return (
    <SidebarContainer>
      <LogoSection>INVENTO<span>.</span></LogoSection>
      <NavMenu>
        {menu.filter(item => item.roles.includes(user?.role)).map(item => (
          <StyledNavLink key={item.path} to={item.path}>{item.icon} {item.name}</StyledNavLink>
        ))}
      </NavMenu>
      <LogoutBtn onClick={logout}><LogOut size={20}/> Logout</LogoutBtn>
    </SidebarContainer>
  );
};

export default Sidebar;