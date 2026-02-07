import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import TopBar from './Topbar';
import { Menu } from 'lucide-react';

const AppLayout = ({ children }) => {
  // Mobile devices start collapsed (hidden)
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);

  return (
    <LayoutWrapper>
      {/* Sidebar handles the drawer logic internally now */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <MainContainer $isCollapsed={isCollapsed}>
        {/* MOBILE BURGER TRIGGER (Visible only on mobile) */}
        <MobileHeader className="no-print">
            <button onClick={() => setIsCollapsed(false)}><Menu /></button>
            <img src="/logo.png" alt="Invento" height="30" />
            <div style={{width: 24}} /> {/* Spacer */}
        </MobileHeader>

        <TopBar />
        <ScrollArea>
           <div className="content-deck">
              {children}
           </div>
        </ScrollArea>
      </MainContainer>
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div` display: flex; min-height: 100vh; background: #04090E; `;

const MainContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
  
  /* DESKTOP MARGIN LOGIC */
  margin-left: ${props => props.$isCollapsed ? '100px' : '280px'};

  /* MOBILE MARGIN LOGIC: No margin on mobile so text is not pushed */
  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const MobileHeader = styled.div`
  display: none;
  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: #04090E;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    button { background: none; border: none; color: white; cursor: pointer; }
  }
`;

const ScrollArea = styled.main`
  flex: 1;
  padding: 2.5rem;
  .content-deck { max-width: 1400px; margin: 0 auto; width: 100%; }
  @media (max-width: 768px) { padding: 1.5rem 1rem; }
`;

export default AppLayout;