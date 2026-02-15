/**
 * InputManager.ts
 * Управление вводом (мышь, клавиатура)
 */

import * as PIXI from 'pixi.js';

export interface InputCallbacks {
  onMouseMove?: (x: number, y: number) => void;
  onMouseClick?: (x: number, y: number) => void;
  onKeyDown?: (key: string) => void;
  onKeyUp?: (key: string) => void;
}

export class InputManager {
  private app: PIXI.Application;
  private callbacks: InputCallbacks = {};
  private pressedKeys: Set<string> = new Set();

  constructor(app: PIXI.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (this.callbacks.onMouseMove) {
        this.callbacks.onMouseMove(event.global.x, event.global.y);
      }
    });

    this.app.stage.on('pointertap', (event: PIXI.FederatedPointerEvent) => {
      if (this.callbacks.onMouseClick) {
        this.callbacks.onMouseClick(event.global.x, event.global.y);
      }
    });

    // Keyboard events
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Track pressed keys
      this.pressedKeys.add(event.key.toLowerCase());

      if (this.callbacks.onKeyDown) {
        this.callbacks.onKeyDown(event.key);
      }
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      // Remove from pressed keys
      this.pressedKeys.delete(event.key.toLowerCase());

      if (this.callbacks.onKeyUp) {
        this.callbacks.onKeyUp(event.key);
      }
    });
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  setCallbacks(callbacks: InputCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy(): void {
    // Remove event listeners
    this.app.stage.off('pointermove');
    this.app.stage.off('pointertap');
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}