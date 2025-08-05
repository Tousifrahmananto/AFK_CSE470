import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // ✅ ensure App.js exists
import AuthProvider from './context/AuthContext'; // if using AuthContext

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider> {/* Optional */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
