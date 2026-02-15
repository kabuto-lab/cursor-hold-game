/**
 * GameEngine.ts
 * Основной движок игры - только PixiJS и тикер
 */

import * as PIXI from 'pixi.js';

export class GameEngine {
  private app: PIXI.Application;
  private ticker: PIXI.Ticker;

  constructor() {
    this.app = new PIXI.Application();
    this.ticker = new PIXI.Ticker();
  }

  async init(): Promise<void> {
    await this.app.init({
      backgroundColor: 0x0f0f23, // Dark blue background
      antialias: false, // For crisp pixel art
      autoDensity: true,
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
    });

    // Add retro filters
    // Note: These filters would need to be imported from appropriate packages
    // const pixelateFilter = new PixelateFilter();
    // pixelateFilter.size = new PIXI.Point(4, 4);

    // const noiseFilter = new NoiseFilter();
    // noiseFilter.noise = 0.1;
    // noiseFilter.seed = Math.random();

    // const bloomFilter = new BloomFilter();
    
    // this.app.stage.filters = [pixelateFilter, noiseFilter, bloomFilter] as any;
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

  start(): void {
    this.ticker.start();
  }

  stop(): void {
    this.ticker.stop();
  }

  addTickerCallback(callback: (deltaTime: number) => void): void {
    this.ticker.add(callback);
  }

  removeTickerCallback(callback: (deltaTime: number) => void): void {
    this.ticker.remove(callback);
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  destroy(): void {
    this.ticker.destroy();
    this.app.destroy(true, { children: true });
  }
}