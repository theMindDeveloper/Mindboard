import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadTheme } from './store/boardStore';
import './styles/tokens.css';
import './styles/reactflow-theme.css';

// Apply persisted theme before first paint.
document.documentElement.setAttribute('data-theme', loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
