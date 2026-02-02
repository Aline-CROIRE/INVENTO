import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import TopBar from './Topbar';
import BackgroundParticles from '../BackgroundParticles';

const PageWrapper = styled.div`
  display: flex; min-height: 100vh; background: #04090E;
`;

const MainContent = styled.div`
  flex: 1; margin-left: 260px; /* Same as sidebar width */
  position: relative; z-index: 1;
`;

const ScrollArea = styled.main`
  padding: 2.5rem;
`;

const AppLayout = ({ children }) => {
  return (
    <PageWrapper>
      <BackgroundParticles />
      <Sidebar />
      <MainContent>
        <TopBar />
        <ScrollArea>
          {children}
        </ScrollArea>
      </MainContent>
    </PageWrapper>
  );
};

export default AppLayout;