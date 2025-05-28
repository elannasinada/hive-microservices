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
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  register: (email: string, password: string, username: string, department: 'IT' | 'LOGISTICS' | 'FINANCE' | 'MARKETING' | 'RESEARCH_AND_DEVELOPMENT' | 'OPERATIONS') => Promise<boolean>;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:9999';

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_BASE}/authenticated/tm`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
    try {
      const data = await authAPI.login({ email, password });
      console.log('Login response data:', data);
      
      const { token: newToken, username, email: userEmail, roles, rolesDescription, active, user_id } = data;
      const normalizedRoles = Array.isArray(roles)
        ? roles.map((r: any) =>
            typeof r === 'string'
              ? r.replace(/^ROLE_/, '').toUpperCase()
              : (r.role ? r.role.replace(/^ROLE_/, '').toUpperCase() : '')
          ).filter(Boolean)
        : [];
      
      const userObj = {
        id: user_id || '',
        username,
        email: userEmail,
        roles: normalizedRoles,
        rolesDescription: rolesDescription || [],
        active: !!active,
        profilePicture: data.profilePicture
      };
      
      console.log('AuthContext user after login:', userObj);
      setUser(userObj);
      setToken(newToken);
      
      // Store in localStorage for persistence
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      // Fetch additional user info
      try {
        const userInfoRes = await fetch('http://localhost:9999/api/v1/inter-communication/current-user-dto', {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (userInfoRes.ok) {
          const userData = await userInfoRes.json();
          const normalizedRoles = Array.isArray(userData.roles)
            ? userData.roles.map((r: any) =>
                typeof r === 'string'
                  ? r.replace(/^ROLE_/, '').toUpperCase()
                  : (r.role ? r.role.replace(/^ROLE_/, '').toUpperCase() : '')
              ).filter(Boolean)
            : [];
          
          const updatedUser = {
            id: userData.user_id || userData.id || userData.userId || userData.email || '',
            username: userData.username,
            email: userData.email,
            roles: normalizedRoles,
            rolesDescription: userData.rolesDescription || [],
            active: !!userData.active,
            profilePicture: userData.profilePicture
          };
          
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Failed to fetch user info after login:', err);
      }
      
      toast({
        title: "Success!",
        description: "You have been logged in successfully."
      });
      return { success: true, role: normalizedRoles[0]?.toUpperCase() };
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

  const register = async (email: string, password: string, username: string, department: 'IT' | 'LOGISTICS' | 'FINANCE' | 'MARKETING' | 'RESEARCH_AND_DEVELOPMENT' | 'OPERATIONS'): Promise<boolean> => {
    try {
      await authAPI.register({ username, password, email, department });
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
    localStorage.removeItem('user');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully."
    });
    window.location.href = '/login';
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
