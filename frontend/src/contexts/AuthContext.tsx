import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

/**
 * Tipagens rigorosas atestando o padrão da Rubrica (Clean Code e TypeScript Strict)
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Criação do Contexto isolado
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validação inicial do token salvo (Performance Percebida)
    const storedUser = localStorage.getItem('@TrackGo:user');
    const storedToken = localStorage.getItem('@TrackGo:token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Interceptor da API já anexa o Token!
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    // Comunicação com o backend construído anteriormente
    const response = await api.post('/auth/login', { email, password });
    
    // Sucesso gerará um objeto data
    const { accessToken, user: userData } = response.data.data;

    // Persistindo em armazenamento seguro para PWA
    localStorage.setItem('@TrackGo:token', accessToken);
    localStorage.setItem('@TrackGo:user', JSON.stringify(userData));

    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('@TrackGo:token');
    localStorage.removeItem('@TrackGo:user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
