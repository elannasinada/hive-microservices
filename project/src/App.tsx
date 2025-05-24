import React from 'react';
import { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you would validate the token with the backend
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthProvider>
      {isAuthenticated ? (
        <Layout />
      ) : (
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </AuthProvider>
  );
}

export default App;