import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@generated/App';
import { Toaster } from '@components/ui/sonner';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
);
