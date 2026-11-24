import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CinemaProvider } from './context/CinemaContext';
import { CartProvider } from './context/CartContext';

// We use HashRouter so routing works perfectly out of the box in both
// standard Vite dev server AND when loaded directly via file://, Apache htdocs subfolders, or static servers!
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <CinemaProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CinemaProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
