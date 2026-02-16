/**
 * GameEngine.ts
 * Core engine managing PixiJS Application and Ticker
 */

import * as PIXI from 'pixi.js';

export interface GameEngineOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
}

export class GameEngine {
  private app: PIXI.Application;
  private ticker: PIXI.Ticker;
  private callbackWrappers: Map<(deltaTime: number) => void, (ticker: PIXI.Ticker) => void> = new Map();

  constructor(options: GameEngineOptions = {}) {
    this.app = new PIXI.Application();
    this.ticker = new PIXI.Ticker();
    
    // Initialize with default options
    const defaultOptions: GameEngineOptions = {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0f0f23, // Dark blue background
      antialias: false, // For crisp pixel art
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    this.app.init(mergedOptions);
  }

  get application(): PIXI.Application {
    return this.app;
  }

  get renderer(): PIXI.Renderer {
    return this.app.renderer;
  }

  get stage(): PIXI.Container {
    return this.app.stage;
  }

  get tickerInstance(): PIXI.Ticker {
    return this.ticker;
  }

  start(): void {
    this.ticker.start();
  }

  stop(): void {
    this.ticker.stop();
  }

  addTickerCallback(callback: (deltaTime: number) => void): void {
    // In PixiJS v8, ticker callback receives Ticker object, not deltaTime directly
    const wrapper = (ticker: PIXI.Ticker) => callback(ticker.deltaTime);
    this.callbackWrappers.set(callback, wrapper);
    this.ticker.add(wrapper);
  }

  removeTickerCallback(callback: (deltaTime: number) => void): void {
    const wrapper = this.callbackWrappers.get(callback);
    if (wrapper) {
      this.ticker.remove(wrapper);
      this.callbackWrappers.delete(callback);
    }
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  destroy(): void {
    this.ticker.destroy();
    this.app.destroy(true, { children: true });
  }
}