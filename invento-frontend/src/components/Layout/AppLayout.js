import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
// Ensure you have Topbar.jsx in the same directory, or remove/adjust the import if you don't use it!
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
            <div style={{width: 24}} /> {/* Spacer to balance flexbox */}
        </MobileHeader>

        {/* Note: If TopBar is not used, you can safely remove it */}
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

export default AppLayout;

// --- STYLES ---

const LayoutWrapper = styled.div` 
  display: flex; 
  min-height: 100vh; 
  background: #04090E; 
`;

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
    button { 
      background: none; 
      border: none; 
      color: white; 
      cursor: pointer; 
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;

const ScrollArea = styled.main`
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto; /* Ensures main content can scroll independently if needed */
  
  .content-deck { 
    max-width: 1400px; 
    margin: 0 auto; 
    width: 100%; 
  }

  @media (max-width: 768px) { 
    padding: 1.5rem 1rem; 
  }
`;