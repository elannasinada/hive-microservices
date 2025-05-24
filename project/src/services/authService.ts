import { apiClient } from './apiClient';

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  },

  register: async (email: string, password: string, name: string): Promise<LoginResponse> => {
    try {
      const data: RegisterRequest = { email, password, name };
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please try again.');
    }
  },

  validateToken: async (token: string) => {
    try {
      const response = await apiClient.post('/api/v1/auth/authenticate', { token });
      return response.data.user;
    } catch (error) {
      console.error('Token validation error:', error);
      throw new Error('Token validation failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

export { authService };