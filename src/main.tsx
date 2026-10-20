import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AppLockGate } from './components/lock/AppLockGate';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root-Element #root fehlt in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <AppLockGate>
      <App />
    </AppLockGate>
  </StrictMode>,
);
