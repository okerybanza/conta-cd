import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SessionTimeoutManager } from './components/security/SessionTimeoutManager';
import './index.css';
import './i18n';

// Désactiver StrictMode pour éviter les double-renders qui causent le "flash"
// StrictMode est utile en développement mais cause des problèmes UX (re-renders, perte de focus)
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <AuthProvider>
    <ToastProvider>
      <SessionTimeoutManager>
        <App />
      </SessionTimeoutManager>
    </ToastProvider>
  </AuthProvider>
);

