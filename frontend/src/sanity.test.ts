import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to storage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});
