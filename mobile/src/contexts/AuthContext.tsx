import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedToken = await AsyncStorage.getItem('@TrackGo:token');
      const storedUser = await AsyncStorage.getItem('@TrackGo:user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        
        // Verifica token com o backend se necessário
        authService.getProfile().catch(() => {
           logout();
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { accessToken, user: userData } = await authService.login(email, password);

    setUser(userData);
    await AsyncStorage.setItem('@TrackGo:token', accessToken);
    await AsyncStorage.setItem('@TrackGo:user', JSON.stringify(userData));
  }

  async function logout() {
    await AsyncStorage.removeItem('@TrackGo:token');
    await AsyncStorage.removeItem('@TrackGo:user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
