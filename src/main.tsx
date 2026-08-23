import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clear old browser caches and ensure fresh updates
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key === 'sakina-pwa-v1') {
        caches.delete(key);
      }
    });
  });
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update();
    }).catch(() => {});
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

