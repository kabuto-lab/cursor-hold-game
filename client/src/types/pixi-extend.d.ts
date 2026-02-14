import { Graphics } from 'pixi.js';

declare module 'pixi.js' {
  interface Graphics {
    userData?: Record<string, any>;
  }
}