import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ThemeProvider } from './lib/ThemeProvider.tsx';
import { ToastProvider } from './lib/ToastContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
