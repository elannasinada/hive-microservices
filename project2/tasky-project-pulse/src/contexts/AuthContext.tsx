import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { authAPI } from '@/utils/api';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  rolesDescription: string[];
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  register: (email: string, password: string, username: string, age: number, education: string, major: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:9999';

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await fetch(`${API_BASE}/authenticated/tm`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            setToken(storedToken);
            // Fetch user info and set user state
            const userInfoRes = await fetch(`${API_BASE}/api/v1/inter-communication/current-user-dto`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (userInfoRes.ok) {
              const userData = await userInfoRes.json();
              setUser(userData);
            } else {
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
    try {
      const data = await authAPI.login({ email, password });
      console.log('Login response data:', data);
      
      const { token: newToken, username, email: userEmail, roles, rolesDescription, active } = data;
      if (!active) {
        toast({
          title: "Account Not Activated",
          description: "Please verify your email before logging in.",
          variant: "destructive"
        });
        return { success: false };
      }
      setToken(newToken);
      setUser({
        id: '',
        username,
        email: userEmail,
        roles,
        rolesDescription,
        active
      });
      localStorage.setItem('token', newToken);
      toast({
        title: "Success!",
        description: "You have been logged in successfully."
      });
      return { success: true, role: roles[0]?.toLowerCase() };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = "Login failed. Invalid credentials.";
      if (error && error.message) {
        errorMsg = error.message;
      }
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false };
    }
  };

  const register = async (email: string, password: string, username: string, age: number, education: string, major: string): Promise<boolean> => {
    try {
      await authAPI.register({ username, password, email, age, education, major });
      toast({
        title: "Registration Successful!",
        description: "Please check your email for verification."
      });
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = "Failed to create account";
      if (error && error.message) {
        errorMsg = error.message;
      }
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully."
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
