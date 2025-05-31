import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { authAPI } from '@/utils/api';

type Department = 'IT' | 'LOGISTICS' | 'FINANCE' | 'MARKETING' | 'OPERATIONS';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  rolesDescription: string[];
  active: boolean;
  profilePicture?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  register: (email: string, password: string, username: string, department: Department) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to normalize user data consistently
const normalizeUserData = (userData: any): User => {
  // Normalize roles
  const normalizedRoles = Array.isArray(userData.roles)
      ? userData.roles.map((r: any) =>
          typeof r === 'string'
              ? r.replace(/^ROLE_/, '').toUpperCase()
              : (r.role ? r.role.replace(/^ROLE_/, '').toUpperCase() : '')
      ).filter(Boolean)
      : [];

  // Extract department from departments array if it exists
  let department = undefined;
  if (Array.isArray(userData.departments) && userData.departments.length > 0) {
    department = userData.departments[0].department;
  }

  return {
    id: userData.user_id || userData.id || userData.userId || '',
    username: userData.username || '',
    email: userData.email || '',
    roles: normalizedRoles,
    rolesDescription: userData.rolesDescription || [],
    active: !!userData.active,
    profilePicture: userData.profilePicture || undefined,
    department: department
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:9999';

  // Helper function to get the correct authentication endpoint based on user roles
  const getAuthEndpointForUser = (userData: any): string => {
    const normalizedRoles = Array.isArray(userData.roles)
        ? userData.roles.map((r: any) =>
            typeof r === 'string'
                ? r.replace(/^ROLE_/, '').toUpperCase()
                : (r.role ? r.role.replace(/^ROLE_/, '').toUpperCase() : '')
        ).filter(Boolean)
        : [];

    // Check roles in priority order: ADMIN > PROJECT_LEADER > TEAM_MEMBER
    if (normalizedRoles.includes('ADMIN')) {
      return '/authenticated/pa';
    } else if (normalizedRoles.includes('PROJECT_LEADER')) {
      return '/authenticated/pl';
    } else if (normalizedRoles.includes('TEAM_MEMBER')) {
      return '/authenticated/tm';
    } else {
      // Default to team member if no specific role found
      return '/authenticated/tm';
    }
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const userInfoRes = await fetch(`${API_BASE}/api/v1/inter-communication/current-user-dto`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (userInfoRes.ok) {
          const userData = await userInfoRes.json();
          const normalizedUser = normalizeUserData(userData);
          setUser(normalizedUser);
        } else {
          console.error('Failed to refresh user info');
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
        setUser(null);
        setToken(null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // First, get user info to determine correct authentication endpoint
          const userInfoRes = await fetch(`${API_BASE}/api/v1/inter-communication/current-user-dto`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (userInfoRes.ok) {
            const userData = await userInfoRes.json();
            const authEndpoint = getAuthEndpointForUser(userData);
            
            console.log('Checking authentication with endpoint:', authEndpoint);
            
            // Now check authentication using the role-specific endpoint
            const response = await fetch(`${API_BASE}${authEndpoint}`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              setToken(storedToken);
              const normalizedUser = normalizeUserData(userData);
              setUser(normalizedUser);
              console.log('Authentication successful for user:', normalizedUser);
            } else {
              console.log('Authentication failed, clearing token');
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
            }
          } else {
            console.log('Failed to get user info, clearing token');
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
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
    try {
      const data = await authAPI.login({ email, password });
      console.log('Login response data:', data);

      const newToken = data.token;

      if (!newToken) {
        throw new Error('No token received from login');
      }

      // Set token first
      setToken(newToken);
      localStorage.setItem('token', newToken);

      // Fetch fresh user data from the API
      const userInfoRes = await fetch(`${API_BASE}/api/v1/inter-communication/current-user-dto`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (userInfoRes.ok) {
        const userData = await userInfoRes.json();
        const normalizedUser = normalizeUserData(userData);
        console.log('User data after login:', normalizedUser);
        setUser(normalizedUser);
      } else {
        console.error('Failed to fetch user info after login');
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        throw new Error('Failed to fetch user information');
      }

      toast({
        title: "Success!",
        description: "You have been logged in successfully."
      });

      const normalizedRoles = Array.isArray(data.roles)
          ? data.roles.map((r: any) =>
              typeof r === 'string'
                  ? r.replace(/^ROLE_/, '').toUpperCase()
                  : (r.role ? r.role.replace(/^ROLE_/, '').toUpperCase() : '')
          ).filter(Boolean)
          : [];

      return { success: true, role: normalizedRoles[0] };
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

  const register = async (email: string, password: string, username: string, department: Department): Promise<boolean> => {
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
    loading,
    refreshUser,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};