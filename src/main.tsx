import './migrateLegacyStorage';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AppLockGate } from './components/lock/AppLockGate';
import { migrateLegacyDatabase } from './db/database';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root-Element #root fehlt in index.html');

function render(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <AppLockGate>
        <App />
      </AppLockGate>
    </StrictMode>,
  );
}

// Erst nach dem einmaligen Datenbank-Umzug (Rebranding) rendern – sonst sähe die App kurz leere Daten.
migrateLegacyDatabase()
  .catch((error: unknown) => console.error('Umzug der alten Datenbank fehlgeschlagen', error))
  .finally(() => render(rootElement));
