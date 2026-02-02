import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    background-color: #04090E;
    color: white;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
`;