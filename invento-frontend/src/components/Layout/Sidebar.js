import React, { useEffect } from 'react';
import styled from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Leaf, Settings, LogOut, ChevronLeft, Menu, Shield, User, Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Handle auto-collapse for medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  // MENU CONFIGURATION - Added Expenses
  const menuItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: <LayoutDashboard size={22} />,
      roles: ['ADMIN', 'OWNER', 'WORKER']
    },
    {
      name: 'Products & Stock',
      path: '/inventory',
      icon: <Package size={22} />,
      roles: ['OWNER', 'WORKER'] 
    },
    {
      name: 'Sales Records',
      path: '/sales',
      icon: <ShoppingCart size={22} />,
      roles: ['OWNER', 'WORKER']
    },
    {
      name: 'Operating Expenses', // NEW EXPENSES ROUTE
      path: '/expenses',
      icon: <Receipt size={22} />,
      roles: ['OWNER', 'WORKER']
    },
    {
      name: 'Sustainablity Report',
      path: '/sustainability',
      icon: <Leaf size={22} />,
      roles: ['OWNER'] 
    },
    {
      name: 'Manage People',
      path: '/users',
      icon: <Users size={22} />,
      roles: ['ADMIN', 'OWNER']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings size={22} />,
      roles: ['ADMIN', 'OWNER', 'WORKER']
    },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const getFriendlyRole = (role) => {
    if (role === 'ADMIN') return 'System Administrator';
    if (role === 'OWNER') return 'Business Owner';
    return 'Staff Member';
  };

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && window.innerWidth < 1024 && (
          <MobileOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <SidebarContainer $collapsed={isCollapsed}>
        <ToggleBtn onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </ToggleBtn>

        {/* LOGO AREA */}
        <LogoWrapper $collapsed={isCollapsed}>
          <motion.div
            className="logo-box"
            animate={{ width: isCollapsed ? '50px' : '140px' }}
          >
            <div className="vivid-glow" />
            <img src="/logo.png" alt="Invento Logo" />
          </motion.div>
        </LogoWrapper>

        {/* NAVIGATION */}
        <NavLinks>
          {filteredMenu.map((item) => (
            <StyledNavLink
              key={item.path}
              to={item.path}
              $active={location.pathname === item.path}
              $collapsed={isCollapsed}
              onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
            >
              <div className="icon-wrap">{item.icon}</div>
              {!isCollapsed && (
                <motion.span className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {item.name}
                </motion.span>
              )}
              {location.pathname === item.path && <ActiveIndicator layoutId="navIndicator" />}
            </StyledNavLink>
          ))}
        </NavLinks>

        {/* PROFILE SECTION */}
        <UserCard $collapsed={isCollapsed}>
          <div className="flex-row">
            <div className="avatar">
              {user?.role === 'ADMIN' ? <Shield size={18} /> : <User size={18} />}
              <div className="status-dot" />
            </div>
            {!isCollapsed && (
              <div className="meta">
                <strong>{user?.name || "User"}</strong>
                <label>{getFriendlyRole(user?.role)}</label>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <LogoutBtn onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </LogoutBtn>
          )}
        </UserCard>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;

// --- STYLES ---

const SidebarContainer = styled.aside`
  width: ${p => p.$collapsed ? '88px' : '280px'};
  height: 100vh; background: #04090E; position: fixed; left: 0; top: 0;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column; z-index: 1100;
  border-right: 1px solid rgba(255, 255, 255, 0.03); padding: 1.5rem 0.8rem;

  @media (max-width: 1024px) {
    width: 280px;
    transform: ${p => p.$collapsed ? 'translateX(-100%)' : 'translateX(0)'};
    box-shadow: 40px 0 80px rgba(0,0,0,0.8);
  }
`;

const MobileOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 1050;
`;

const LogoWrapper = styled.div`
  margin-bottom: 3.5rem; display: flex; justify-content: center; align-items: center; padding-top: 1rem;
  .logo-box {
    position: relative; display: flex; align-items: center; justify-content: center;
    img { width: 100%; height: auto; z-index: 2; filter: drop-shadow(0 0 10px rgba(0, 123, 255, 0.3)); }
    .vivid-glow { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0, 123, 255, 0.1) 0%, transparent 75%); filter: blur(8px); z-index: 1; }
  }
`;

const NavLinks = styled.nav` flex: 1; display: flex; flex-direction: column; gap: 8px; `;

const StyledNavLink = styled(NavLink)`
  display: flex; align-items: center; gap: 15px; padding: 12px 14px; border-radius: 14px;
  color: #64748b; text-decoration: none; transition: 0.3s; position: relative;
  .icon-wrap { min-width: 24px; display: flex; justify-content: center; }
  .label { font-weight: 600; font-size: 0.9rem; white-space: nowrap; }
  &:hover { color: white; background: rgba(255, 255, 255, 0.02); }
  &.active {
    color: white; background: rgba(0, 123, 255, 0.08);
    .icon-wrap { color: #007BFF; filter: drop-shadow(0 0 8px rgba(0, 123, 255, 0.5)); }
  }
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute; left: -8px; width: 4px; height: 20px; background: #007BFF;
  border-radius: 0 4px 4px 0; box-shadow: 2px 0 10px #007BFF;
`;

const ToggleBtn = styled.button`
  position: absolute; right: -13px; top: 40px; width: 28px; height: 28px;
  background: #007BFF; color: white; border: none; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); z-index: 10;
  @media (max-width: 1024px) { display: none; }
`;

const UserCard = styled.div`
  margin-top: auto; padding: 0.8rem; background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  .flex-row { display: flex; align-items: center; gap: 12px; flex: 1; 
    .avatar { position: relative; width: 40px; height: 40px; border-radius: 10px; background: #0D141C; display: flex; align-items: center; justify-content: center; color: #3b82f6; border: 1px solid rgba(255,255,255,0.05);
      .status-dot { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #10b981; border: 2px solid #04090E; border-radius: 50%; } }
    .meta { display: flex; flex-direction: column; overflow: hidden;
      strong { color: #f8fafc; font-size: 0.85rem; white-space: nowrap; text-overflow: ellipsis; }
      label { color: #475569; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; } } }
`;

const LogoutBtn = styled.button`
  background: rgba(239, 68, 68, 0.1); border: none; width: 32px; height: 32px; border-radius: 8px; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
  &:hover { background: #ef4444; color: white; }
`;