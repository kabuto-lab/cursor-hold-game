import * as PIXI from 'pixi.js';

/**
 * Базовый игровой движок
 * Только рендер + ticker, без логики
 */
export class GameEngine {
  app: PIXI.Application | null = null;
  private ticker: PIXI.Ticker | null = null;

  constructor() {
    console.log('[GameEngine] Constructor called');
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

    // Создаём и инициализируем приложение
    this.app = new PIXI.Application();
    
    await this.app.init({
      backgroundColor: 0x1a1a1a,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });

    console.log('[GameEngine] PixiJS initialized, getting ticker...');
    
    // Получаем ticker после инициализации
    this.ticker = this.app.ticker;
    
    console.log('[GameEngine] Appending canvas...');
    // Добавляем canvas в контейнер
    container.appendChild(this.app.canvas);
    
    console.log('[GameEngine] Canvas appended');
  }

  /**
   * Добавить обновление на тикер
   */
  addTickerUpdate(updateFn: (dt: number) => void): void {
    if (this.ticker) {
      this.ticker.add((ticker) => {
        const dt = ticker.deltaTime;
        updateFn(dt);
      });
    } else {
      console.error('[GameEngine] Ticker is null!');
    }
  }

  /**
   * Запустить тикер
   */
  start(): void {
    if (this.ticker) {
      this.ticker.start();
      console.log('[GameEngine] Ticker started');
    } else {
      console.error('[GameEngine] Cannot start: ticker is null');
    }
  }

  /**
   * Остановить тикер
   */
  stop(): void {
    if (this.ticker) {
      this.ticker.stop();
    }
  }
}