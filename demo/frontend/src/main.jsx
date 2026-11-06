import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ClinicProvider } from './context/ClinicContext';
import { ToastProvider } from './components/Toast';

import './styles/globals.css';
import './styles/components.css';
import './styles/pages.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ClinicProvider>
          <App />
        </ClinicProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
