import * as PIXI from 'pixi.js';

/**
 * Базовый игровой движок
 * Только рендер + ticker, без логики
 */
export class GameEngine {
  app: PIXI.Application | null = null;
  private ticker: PIXI.Ticker | null = null;
  private gridGraphics: PIXI.Graphics | null = null;
  
  // Настройки сетки (будут рассчитаны динамически)
  private cellSize: number = 50;  // Будет пересчитано
  private readonly GRID_COLOR: number = 0x00ffff;
  private readonly GRID_ALPHA: number = 0.3;
  private readonly GRID_LINE_WIDTH: number = 1;
  
  // Целевое количество ячеек (для расчёта)
  private readonly TARGET_COLS: number = 24;  // ~24 колонки
  private readonly TARGET_ROWS: number = 18;  // ~18 рядов

  constructor() {
    console.log('[GameEngine] Constructor called');
  }

  /**
   * Рассчитать размер ячейки исходя из разрешения экрана
   * Стремимся к квадратным ячейкам с погрешностью до 5%
   */
  private calculateCellSize(): number {
    if (!this.app) return 50;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // Рассчитываем размер ячейки для целевого количества колонок и рядов
    const sizeByWidth = screenWidth / this.TARGET_COLS;
    const sizeByHeight = screenHeight / this.TARGET_ROWS;

    // Берём среднее значение для квадратных ячеек
    let cellSize = (sizeByWidth + sizeByHeight) / 2;

    // Округляем до ближайшего числа, кратного 5 (для красоты)
    cellSize = Math.round(cellSize / 5) * 5;

    // Проверяем погрешность (не более 5%)
    const aspectRatio = screenWidth / screenHeight;
    const idealAspectRatio = this.TARGET_COLS / this.TARGET_ROWS;
    const aspectError = Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio;

    if (aspectError > 0.05) {
      // Если погрешность больше 5%, корректируем размер
      if (aspectRatio > idealAspectRatio) {
        // Экран шире, чем нужно — уменьшаем размер ячейки
        cellSize = sizeByWidth;
      } else {
        // Экран уже, чем нужно — увеличиваем размер ячейки
        cellSize = sizeByHeight;
      }
    }

    // Минимальный и максимальный размер
    cellSize = Math.max(20, Math.min(100, cellSize));

    console.log(`[GameEngine] Calculated cell size: ${cellSize}px (screen: ${screenWidth}x${screenHeight})`);
    return cellSize;
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

    // Рассчитываем размер ячейки и рисуем сетку
    this.cellSize = this.calculateCellSize();
    this.drawGrid();

    console.log('[GameEngine] Canvas appended');
  }

  /**
   * Нарисовать сетку с квадратными ячейками
   */
  private drawGrid(): void {
    if (!this.app) return;

    console.log('[GameEngine] Drawing grid (cell size: ' + this.cellSize + 'px)...');

    this.gridGraphics = new PIXI.Graphics();
    this.gridGraphics.zIndex = 0; // Сетка на заднем плане

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Вертикальные линии
    for (let x = 0; x <= width; x += this.cellSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Горизонтальные линии
    for (let y = 0; y <= height; y += this.cellSize) {
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

    // Пересчитываем размер ячейки
    this.cellSize = this.calculateCellSize();

    // Очищаем старую сетку
    this.gridGraphics.clear();

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Вертикальные линии
    for (let x = 0; x <= width; x += this.cellSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Горизонтальные линии
    for (let y = 0; y <= height; y += this.cellSize) {
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