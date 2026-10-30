import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './pwa';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA service worker for offline shell & low-bandwidth caching
registerServiceWorker({
  onSuccess: () => {
    console.info('[PWA] CareerBridge service worker successfully registered.');
  },
  onUpdate: () => {
    console.info('[PWA] New CareerBridge update available.');
  },
});
