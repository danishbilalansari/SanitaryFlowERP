import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Recover gracefully if a browser tab has a stale cached HTML shell referencing a previous build's chunk hash
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 'sf_chunk_reload_ts';
  const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
  if (Date.now() - lastReload > 10_000) {
    sessionStorage.setItem(reloadKey, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
