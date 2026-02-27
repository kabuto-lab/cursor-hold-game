// vitest.setup.ts
import { vi } from 'vitest';

// Mock the PIXI and colyseus modules
vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Graphics: vi.fn(),
  Sprite: vi.fn(),
  Texture: vi.fn(),
  Renderer: vi.fn(),
}));

vi.mock('colyseus.js', () => ({
  Client: vi.fn(),
}));