import * as PIXI from 'pixi.js';

/**
 * Базовый игровой движок
 * Только рендер + ticker, без логики
 */
export class GameEngine {
  readonly app: PIXI.Application;
  private ticker: PIXI.Ticker;

  constructor(containerId: string = 'canvasContainer') {
    this.app = new PIXI.Application();
    this.ticker = this.app.ticker;

    console.log('[GameEngine] Constructor called with containerId:', containerId);
  }

  /**
   * Инициализировать PixiJS (асинхронно)
   */
  async init(containerId: string): Promise<void> {
    console.log('[GameEngine] Initializing PixiJS...');
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    await this.app.init({
      backgroundColor: 0x1a1a1a,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });

    console.log('[GameEngine] PixiJS initialized, appending canvas...');
    
    // Добавляем canvas в контейнер
    container.appendChild(this.app.canvas);
    
    console.log('[GameEngine] Canvas appended');
  }

  /**
   * Добавить обновление на тикер
   */
  addTickerUpdate(updateFn: (dt: number) => void): void {
    this.ticker.add((ticker) => {
      const dt = ticker.deltaTime;
      updateFn(dt);
    });
  }

  /**
   * Запустить тикер
   */
  start(): void {
    this.ticker.start();
  }

  /**
   * Остановить тикер
   */
  stop(): void {
    this.ticker.stop();
  }
}