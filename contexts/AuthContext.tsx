import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner-native';
import { ENDPOINTS } from '../utils/config';

interface User {
  id: number;
  username: string;
  email: string;
}



interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoading: true,
  });

  const isAuthenticated = !!state.accessToken && !!state.user;

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userStr = await AsyncStorage.getItem('user');

      setState({
        accessToken,
        refreshToken,
        user: userStr ? JSON.parse(userStr) : null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading auth:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Login failed');
      }

      const data = await response.json();

      const userResponse = await fetch(ENDPOINTS.ME, {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }

      const userData = await userResponse.json();

      await AsyncStorage.multiSet([
        ['accessToken', data.access],
        ['refreshToken', data.refresh],
        ['user', JSON.stringify(userData)],
      ]);

      setState({
        accessToken: data.access,
        refreshToken: data.refresh,
        user: userData,
        isLoading: false,
      });
      
      
     router.replace('/app/home')
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, password: string, email: string) => {
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Registration failed');
      }
      
      toast.success('Registration successful! Please login.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
    });
    toast.success('Logged out successfully');
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await fetch(ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('accessToken', data.access);
      setState((prev) => ({ ...prev, accessToken: data.access }));

      return data.access;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      await logout();
      return null;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated,
        login,
        register,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
