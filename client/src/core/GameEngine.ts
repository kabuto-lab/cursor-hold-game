// GameEngine.ts - only PIXI.Application + ticker + basic resize
import * as PIXI from 'pixi.js';

export class GameEngine {
  private app: PIXI.Application;
  private ticker: PIXI.Ticker;

  constructor() {
    this.app = new PIXI.Application();
    this.ticker = new PIXI.Ticker();
    
    this.app.init({
      backgroundColor: 0x0f0f23, // Dark blue background
      antialias: false, // For crisp pixel art
      autoDensity: true,
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
    });
  }

  get application(): PIXI.Application {
    return this.app;
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
    this.ticker.add((ticker) => callback(ticker.deltaTime));
  }

  removeTickerCallback(callback: (deltaTime: number) => void): void {
    this.ticker.remove((ticker) => callback(ticker.deltaTime));
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  destroy(): void {
    this.ticker.destroy();
    this.app.destroy(true, { children: true });
  }
}