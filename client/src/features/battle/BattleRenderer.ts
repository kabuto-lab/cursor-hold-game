/**
 * BattleRenderer — визуализация битвы вирусов в стиле "нейроны"
 * 
 * Визуальный стиль:
 * - Каждая клетка — круг (нейрон)
 * - Клетки соединены линиями (синапсы)
 * - Пульсация активных клеток
 */

import * as PIXI from 'pixi.js';

export interface BattleRendererConfig {
  cellDiameter: number;
  cellGap: number;
  pulseSpeed: number;
  contestedFlickerSpeed: number;
}

export class BattleRenderer {
  private container: PIXI.Container;
  private cellContainers: Map<number, PIXI.Container> = new Map();
  private linesContainer: PIXI.Graphics;
  private config: BattleRendererConfig;
  private currentGrid: number[] | null = null;  // Текущее состояние сетки для анимации

  private gridWidth: number = 64;
  private gridHeight: number = 36;
  private totalCells: number = this.gridWidth * this.gridHeight;
  
  private readonly COLORS = {
    empty: 0x1a1a1a,
    virusA: 0xff3333,  // Яркий красный
    virusB: 0x3333ff,  // Яркий синий
    lineEmpty: 0x333333,
    lineActive: 0x666666
  };

  constructor(
    stage: PIXI.Container,
    config?: Partial<BattleRendererConfig>
  ) {
    this.container = new PIXI.Container();
    this.linesContainer = new PIXI.Graphics();
    this.container.addChild(this.linesContainer);
    
    this.config = {
      cellDiameter: 25,  // Увеличили размер клеток
      cellGap: 1,
      pulseSpeed: 2000,
      contestedFlickerSpeed: 200,
      ...config
    };

    this.container.zIndex = 1000;  // На переднем плане
    this.container.alpha = 0;
    this.container.visible = false;

    stage.addChild(this.container);
    
    // Сортируем children stage по zIndex
    if (stage.sortChildren) {
      stage.sortChildren();
    }
    
    console.log('[BattleRenderer] Created', {
      stageChildren: stage.children.length,
      containerZIndex: this.container.zIndex,
      containerVisible: this.container.visible,
      containerAlpha: this.container.alpha
    });
  }

  initGrid(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.totalCells = width * height;

    console.log(`[BattleRenderer] Init grid: ${width}×${height} = ${this.totalCells} cells`);

    // Очистка старых контейнеров
    this.cellContainers.forEach(container => {
      this.container.removeChild(container);
      container.destroy({ children: true });
    });
    this.cellContainers.clear();
    this.linesContainer.clear();

    // Создание клеток с ПРАВИЛЬНЫМ позиционированием
    const diameter = this.config.cellDiameter;
    const step = diameter + this.config.cellGap;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const container = this.createCellContainer(x, y);
        
        // Устанавливаем позицию сразу при создании
        container.position.x = x * step + step / 2;
        container.position.y = y * step + step / 2;
        
        this.cellContainers.set(idx, container);
        this.container.addChild(container);
      }
    }

    // Рисуем линии после того, как все позиции установлены
    this.drawSynapses();
    
    // Центрируем весь контейнер на экране
    this.centerGrid();

    console.log(`[BattleRenderer] Grid positioned at:`, this.container.position);
  }

  private createCellContainer(x: number, y: number): PIXI.Container {
    const container = new PIXI.Container();
    
    const cell = new PIXI.Graphics();
    const diameter = this.config.cellDiameter;
    const radius = diameter / 2;
    
    cell.beginFill(this.COLORS.empty, 1);
    cell.drawCircle(0, 0, radius);
    cell.endFill();
    
    const glow = new PIXI.Graphics();
    glow.beginFill(this.COLORS.empty, 0.3);
    glow.drawCircle(0, 0, radius + 2);
    glow.endFill();

    container.addChild(glow);
    container.addChild(cell);
    container.name = `cell_${x}_${y}`;

    (container as any).cellGraphics = cell;
    (container as any).glowGraphics = glow;

    return container;
  }

  private drawSynapses(): void {
    this.linesContainer.clear();
    this.linesContainer.lineStyle(1, this.COLORS.lineEmpty, 0.5);

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        const container = this.cellContainers.get(idx);
        if (!container) continue;

        const x1 = container.position.x;
        const y1 = container.position.y;

        const neighbors = [
          {dx: 1, dy: 0},
          {dx: 0, dy: 1},
          {dx: 1, dy: 1},
          {dx: -1, dy: 1}
        ];

        for (const neighbor of neighbors) {
          const nx = x + neighbor.dx;
          const ny = y + neighbor.dy;

          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            const nIdx = ny * this.gridWidth + nx;
            const nContainer = this.cellContainers.get(nIdx);
            if (nContainer) {
              const x2 = nContainer.position.x;
              const y2 = nContainer.position.y;
              
              this.linesContainer.moveTo(x1, y1);
              this.linesContainer.lineTo(x2, y2);
            }
          }
        }
      }
    }
  }

  private centerGrid(): void {
    const diameter = this.config.cellDiameter;
    const gap = this.config.cellGap;
    const step = diameter + gap;

    const gridWidthPx = this.gridWidth * step;
    const gridHeightPx = this.gridHeight * step;

    // Центрируем только контейнер, позиции клеток уже установлены
    this.container.position.x = (window.innerWidth - gridWidthPx) / 2;
    this.container.position.y = (window.innerHeight - gridHeightPx) / 2;
  }

  updateGrid(grid: number[]): void {
    if (grid.length !== this.totalCells) {
      console.error('[BattleRenderer] Grid size mismatch:', grid.length, '!=', this.totalCells);
      return;
    }

    // Сохраняем сетку для анимации
    this.currentGrid = [...grid];

    let virusACount = 0;
    let virusBCount = 0;
    let emptyCount = 0;

    for (let i = 0; i < this.totalCells; i++) {
      const cellValue = grid[i];
      const container = this.cellContainers.get(i);

      if (container) {
        this.updateCell(container, cellValue);
        if (cellValue === 1) virusACount++;
        else if (cellValue === 2) virusBCount++;
        else emptyCount++;
      }
    }

    console.log(`[BattleRenderer] Grid updated: RED=${virusACount}, BLUE=${virusBCount}, EMPTY=${emptyCount}, TOTAL=${this.totalCells}`);
    
    // Лог для проверки первых нескольких клеток
    console.log('[BattleRenderer] First 10 cells:', grid.slice(0, 10));
  }

  private updateCell(container: PIXI.Container, value: number): void {
    const cell = (container as any).cellGraphics as PIXI.Graphics;
    const glow = (container as any).glowGraphics as PIXI.Graphics;

    if (!cell || !glow) return;

    cell.clear();
    glow.clear();

    const diameter = this.config.cellDiameter;
    const radius = diameter / 2;

    if (value === 0) {
      // Пустая клетка - тёмная
      cell.beginFill(this.COLORS.empty, 1);
      cell.drawCircle(0, 0, radius);
      cell.endFill();

      glow.beginFill(this.COLORS.empty, 0.3);
      glow.drawCircle(0, 0, radius + 2);
      glow.endFill();
    } else if (value === 1) {
      // Virus A - ЯРКИЙ КРАСНЫЙ с сильным свечением
      const pulse = this.getPulseValue();
      cell.beginFill(this.COLORS.virusA, 1);
      cell.drawCircle(0, 0, radius * pulse);
      cell.endFill();

      // Сильное свечение
      glow.beginFill(this.COLORS.virusA, 0.8);
      glow.drawCircle(0, 0, radius * pulse + 5);
      glow.endFill();
    } else if (value === 2) {
      // Virus B - ЯРКИЙ СИНИЙ с сильным свечением
      const pulse = this.getPulseValue();
      cell.beginFill(this.COLORS.virusB, 1);
      cell.drawCircle(0, 0, radius * pulse);
      cell.endFill();

      // Сильное свечение
      glow.beginFill(this.COLORS.virusB, 0.8);
      glow.drawCircle(0, 0, radius * pulse + 5);
      glow.endFill();
    }
  }

  private getPulseValue(): number {
    const time = Date.now() % this.config.pulseSpeed;
    const normalized = time / this.config.pulseSpeed;
    return 1 + 0.1 * Math.sin(normalized * Math.PI * 2);
  }

  show(): void {
    console.log('[BattleRenderer] show() CALLED');
    console.log('[BattleRenderer] Container state before show:', {
      alpha: this.container.alpha,
      visible: this.container.visible,
      zIndex: this.container.zIndex,
      children: this.container.children.length,
      position: this.container.position
    });
    
    this.container.alpha = 1;
    this.container.visible = true;
    
    console.log('[BattleRenderer] Container state after show:', {
      alpha: this.container.alpha,
      visible: this.container.visible
    });
  }

  hide(): void {
    this.container.alpha = 0;
    this.container.visible = false;
    console.log('[BattleRenderer] Hide');
  }

  /**
   * Проверить, является ли клетка "спорной" (соседствуют вирусы A и B)
   */
  private isContested(index: number): boolean {
    if (!this.currentGrid) return false;

    const x = index % this.gridWidth;
    const y = Math.floor(index / this.gridWidth);
    const cellValue = this.currentGrid[index];

    if (cellValue === 0) return false;

    // Проверяем соседей (4 направления)
    const neighbors = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];

    for (const neighbor of neighbors) {
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        const nIdx = ny * this.gridWidth + nx;
        const neighborValue = this.currentGrid[nIdx];

        // Если сосед другого типа - клетка спорная
        if (neighborValue !== 0 && neighborValue !== cellValue) {
          return true;
        }
      }
    }

    return false;
  }

  update(delta: number): void {
    // Анимация пульсации для всех активных клеток
    if (!this.currentGrid) {
      return;
    }

    const now = Date.now();
    const pulse = 1 + 0.1 * Math.sin((now / this.config.pulseSpeed) * Math.PI * 2);

    let activeCount = 0;
    for (let i = 0; i < this.totalCells; i++) {
      const cellValue = this.currentGrid[i];
      const container = this.cellContainers.get(i);

      if (container && cellValue !== 0) {
        activeCount++;
        // Пульсация масштаба
        container.scale.set(pulse);

        // Мерцание для спорных клеток (где соседствуют вирусы A и B)
        if (this.isContested(i)) {
          const flicker = 0.5 + 0.5 * Math.sin((now / this.config.contestedFlickerSpeed) * Math.PI * 2);
          container.alpha = flicker;
        } else {
          container.alpha = 1;
        }
      }
    }
    
    // Лог каждые 60 кадров (примерно 1 секунда)
    if (Date.now() % 1000 < 100) {
      console.log(`[BattleRenderer.update] Active cells: ${activeCount}/${this.totalCells}, pulse: ${pulse.toFixed(3)}`);
    }
  }

  destroy(): void {
    this.cellContainers.forEach(container => {
      container.destroy({ children: true });
    });
    this.cellContainers.clear();
    this.linesContainer.destroy();
    this.container.destroy();
    console.log('[BattleRenderer] Destroyed');
  }
}
