import * as PIXI from 'pixi.js';

/**
 * Базовый игровой движок
 * Только рендер + ticker, без логики
 */
export class GameEngine {
  readonly app: PIXI.Application;
  private ticker: PIXI.Ticker;

  constructor(canvasId: string) {
    this.app = new PIXI.Application();
    this.ticker = this.app.ticker;
    
    // Инициализация canvas
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    
    this.app.init({
      view: canvas,
      backgroundColor: 0x1a1a1a,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });
  }

  /**
   * Добавить обновление на тикер
   * @param updateFn - функция обновления (dt передаётся автоматически)
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