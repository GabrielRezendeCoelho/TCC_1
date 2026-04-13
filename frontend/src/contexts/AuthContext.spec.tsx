import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';
import api from '../services/api'; 
import React from 'react';

// Mocks
vi.mock('../services/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      }
    }
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve inicializar deslogado por padrão (sem token no localStorage)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('deve logar com sucesso e salvar dados na sessão', async () => {
    (api.post as vi.Mock).mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'fake-jwt',
          user: { id: '1', email: 'test@test.com', role: 'ADMIN' },
        }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });

    expect(result.current.token).toBe('fake-jwt');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('trackgo_token')).toBe('fake-jwt');
  });

  it('deve deslogar com sucesso e limpar sessão', async () => {
    // Configura estado pre-logado falso
    localStorage.setItem('trackgo_token', 'valid-token');
    
    // AuthProvider tenta usar a API para fetch profile no mount se tem token
    (api.get as vi.Mock).mockResolvedValueOnce({ data: { data: { id: '1' } } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    // Forçamos o logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('trackgo_token')).toBeNull();
  });
});
