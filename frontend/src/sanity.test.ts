import { describe, it, expect } from 'vitest'

describe('Teste de Sanidade', () => {
  it('deve passar no teste básico de sanidade', () => {
    expect(1 + 1).toBe(2)
  })

  it('deve ter acesso ao localStorage', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
  })
})
