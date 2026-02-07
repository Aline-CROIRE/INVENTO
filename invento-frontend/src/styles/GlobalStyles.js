import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --sidebar-w: 280px;
    --sidebar-collapsed-w: 100px;
  }

  html {
    /* This makes 1rem = 16px on desktop, 14px on tablet, 12px on mobile */
    font-size: 16px;
    @media (max-width: 1024px) { font-size: 15px; }
    @media (max-width: 768px) { font-size: 14px; }
  }

  body {
    margin: 0;
    padding: 0;
    background-color: #04090E;
    color: white;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden; /* CRITICAL: Prevents horizontal shake on mobile */
  }

  /* Global Responsive Headers */
  h1 { font-size: 2.5rem; @media (max-width: 768px) { font-size: 1.8rem; } }
  h2 { font-size: 2rem; @media (max-width: 768px) { font-size: 1.4rem; } }
  
  * { box-sizing: border-box; }
`;