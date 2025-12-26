import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mocks do DOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.window.scrollTo = vi.fn();

// Limpeza automática após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});