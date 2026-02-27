import * as PIXI from 'pixi.js';

/**
 * Базовый игровой движок
 * Только рендер + ticker, без логики
 */
export class GameEngine {
  app: PIXI.Application | null = null;
  private ticker: PIXI.Ticker | null = null;
  private gridGraphics: PIXI.Graphics | null = null;
  
  // Настройки сетки
  private readonly CELL_WIDTH: number = 80;
  private readonly CELL_HEIGHT: number = 45;
  private readonly GRID_COLOR: number = 0x00ffff;
  private readonly GRID_ALPHA: number = 0.3;
  private readonly GRID_LINE_WIDTH: number = 1;

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

    // КРИТИЧЕСКАЯ СТРОКА — отключаем pointer events на canvas
    // ВАЖНО: Оставляем pointer-events: auto для интерактивных объектов (drag-and-drop)
    this.app.canvas.style.pointerEvents = 'auto';

    console.log('[GameEngine] Appending canvas...');
    // Добавляем canvas в контейнер
    container.appendChild(this.app.canvas);

    // Рисуем сетку
    this.drawGrid();

    console.log('[GameEngine] Canvas appended');
  }

  /**
   * Нарисовать сетку с ячейками 80x45
   */
  private drawGrid(): void {
    if (!this.app) return;

    console.log('[GameEngine] Drawing grid (80x45 cells)...');

    this.gridGraphics = new PIXI.Graphics();
    this.gridGraphics.zIndex = 0; // Сетка на заднем плане

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Вертикальные линии
    for (let x = 0; x <= width; x += this.CELL_WIDTH) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Горизонтальные линии
    for (let y = 0; y <= height; y += this.CELL_HEIGHT) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    this.gridGraphics.stroke({
      width: this.GRID_LINE_WIDTH,
      color: this.GRID_COLOR,
      alpha: this.GRID_ALPHA,
    });

    this.app.stage.addChild(this.gridGraphics);
    console.log('[GameEngine] Grid drawn');
  }

  /**
   * Перерисовать сетку при изменении размера
   */
  resizeGrid(): void {
    if (!this.app || !this.gridGraphics) return;

    // Очищаем старую сетку
    this.gridGraphics.clear();

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Вертикальные линии
    for (let x = 0; x <= width; x += this.CELL_WIDTH) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Горизонтальные линии
    for (let y = 0; y <= height; y += this.CELL_HEIGHT) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    this.gridGraphics.stroke({
      width: this.GRID_LINE_WIDTH,
      color: this.GRID_COLOR,
      alpha: this.GRID_ALPHA,
    });
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