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
  defenseRingCount?: number;  // Number of defense rings (0-4)
  defenseShimmerSpeed?: number;  // Speed of shield shimmer animation
}

export class BattleRenderer {
  private container: PIXI.Container;
  private cellContainers: Map<number, PIXI.Container> = new Map();
  private linesContainer: PIXI.Graphics;
  private config: BattleRendererConfig;
  private currentGrid: number[] | null = null;  // Текущее состояние сетки для анимации

  // Virus params for defense visualization
  private paramsA: { defense: number } | null = null;
  private paramsB: { defense: number } | null = null;

  private gridWidth: number = 32;
  private gridHeight: number = 20;
  private totalCells: number = this.gridWidth * this.gridHeight;

  // Responsive sizing
  private baseCellDiameter: number = 25;
  private currentCellDiameter: number = 25;
  private currentCellGap: number = 1;
  private scaleFactor: number = 1;

  private readonly COLORS = {
    empty: 0x1a1a1a,
    virusA: 0xff3333,  // Яркий красный
    virusB: 0x3333ff,  // Яркий синий
    lineEmpty: 0x333333,
    lineActive: 0x666666,
    defenseShield: 0x00ffff,  // Cyan shield border
    defenseGlow: 0x00aaaa,  // Darker cyan for glow
  };

  // Defense visualization
  private defenseRingGraphics: Map<number, PIXI.Graphics> = new Map();  // Per-cell defense rings

  constructor(
    stage: PIXI.Container,
    config?: Partial<BattleRendererConfig>
  ) {
    this.container = new PIXI.Container();
    this.linesContainer = new PIXI.Graphics();
    this.container.addChild(this.linesContainer);

    this.config = {
      cellDiameter: 25,
      cellGap: 1,
      pulseSpeed: 2000,
      contestedFlickerSpeed: 200,
      defenseRingCount: 0,
      defenseShimmerSpeed: 1500,
      ...config
    };

    this.baseCellDiameter = this.config.cellDiameter;

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

    // Рассчитываем адаптивный размер клеток
    this.calculateResponsiveSizing();

    // Создание клеток с ПРАВИЛЬНЫМ позиционированием
    const diameter = this.currentCellDiameter;
    const gap = this.currentCellGap;
    const step = diameter + gap;

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

  /**
   * Calculate responsive cell sizing based on screen dimensions
   */
  private calculateResponsiveSizing(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Account for sidebars (33% each) - grid should fit in remaining space
    const availableWidth = screenWidth * 0.9;  // Leave some margin
    const availableHeight = screenHeight * 0.85;  // Leave space for top panel

    // Calculate cell size to fit grid in available space
    const cellSizeByWidth = availableWidth / this.gridWidth;
    const cellSizeByHeight = availableHeight / this.gridHeight;

    // Take the smaller to ensure grid fits
    const idealCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);

    // Clamp between min and max sizes
    this.currentCellDiameter = Math.max(8, Math.min(40, idealCellSize - 2));
    this.currentCellGap = Math.max(1, Math.min(4, this.currentCellDiameter * 0.1));

    // Calculate scale factor for smooth animations
    this.scaleFactor = this.currentCellDiameter / this.baseCellDiameter;

    console.log(`[BattleRenderer] Responsive sizing:`, {
      screenWidth,
      screenHeight,
      availableWidth,
      availableHeight,
      cellSizeByWidth: cellSizeByWidth.toFixed(2),
      cellSizeByHeight: cellSizeByHeight.toFixed(2),
      cellDiameter: this.currentCellDiameter.toFixed(2),
      cellGap: this.currentCellGap.toFixed(2),
      scaleFactor: this.scaleFactor.toFixed(3)
    });
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

    // Create defense shield rings (hollow border effect)
    const defenseRings = this.createDefenseRings(radius);

    container.addChild(defenseRings);  // Rings behind cell
    container.addChild(glow);
    container.addChild(cell);
    container.name = `cell_${x}_${y}`;

    (container as any).cellGraphics = cell;
    (container as any).glowGraphics = glow;
    (container as any).defenseRings = defenseRings;

    return container;
  }

  /**
   * Create concentric defense shield rings (hollow border)
   * Returns a container with up to 4 rings based on defense level
   */
  private createDefenseRings(baseRadius: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // Create 4 concentric rings (max defense = 12 points = 4 rings)
    // Each ring represents 3 points of defense
    for (let i = 0; i < 4; i++) {
      const ring = new PIXI.Graphics();
      const ringRadius = baseRadius + 3 + (i * 3);  // Spaced 3px apart
      const thickness = 2;  // Ring thickness
      
      // Start invisible - will be shown based on defense value
      ring.lineStyle(thickness, this.COLORS.defenseShield, 0);  // Alpha 0 initially
      ring.drawCircle(0, 0, ringRadius);
      
      // Add outer glow
      const glow = new PIXI.Graphics();
      glow.lineStyle(thickness + 2, this.COLORS.defenseGlow, 0);
      glow.drawCircle(0, 0, ringRadius);
      
      container.addChild(glow);
      container.addChild(ring);
    }
    
    return container;
  }

  /**
   * Update defense shield rings based on defense parameter value
   */
  private updateDefenseRings(container: PIXI.Container, defenseValue: number, virusType: number): void {
    const defenseRings = (container as any).defenseRings as PIXI.Container;
    if (!defenseRings) return;

    // Clamp defense between 0-12
    const defense = Math.max(0, Math.min(12, defenseValue));
    
    // Calculate number of active rings (1 ring per 3 defense points)
    const activeRings = Math.ceil(defense / 3);
    
    // Virus color for shield tint
    const shieldColor = virusType === 1 ? this.COLORS.virusA : this.COLORS.virusB;
    const shieldGlowColor = virusType === 1 ? 0xaa0000 : 0x0000aa;

    for (let i = 0; i < 4; i++) {
      const ring = defenseRings.children[i * 2] as PIXI.Graphics;  // Ring graphics
      const glow = defenseRings.children[i * 2 + 1] as PIXI.Graphics;  // Glow graphics
      
      if (!ring || !glow) continue;

      if (i < activeRings) {
        // Show ring with brightness based on defense level
        const alpha = 0.6 + (defense / 12) * 0.4;  // 0.6 - 1.0 alpha
        ring.lineStyle(2, shieldColor, alpha);
        glow.lineStyle(4, shieldGlowColor, alpha * 0.5);
      } else {
        // Hide ring
        ring.lineStyle(2, this.COLORS.defenseShield, 0);
        glow.lineStyle(4, this.COLORS.defenseGlow, 0);
      }
    }
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
    const diameter = this.currentCellDiameter;
    const gap = this.currentCellGap;
    const step = diameter + gap;

    const gridWidthPx = this.gridWidth * step;
    const gridHeightPx = this.gridHeight * step;

    // Центрируем только контейнер, позиции клеток уже установлены
    this.container.position.x = (window.innerWidth - gridWidthPx) / 2;
    this.container.position.y = (window.innerHeight - gridHeightPx) / 2;
  }

  /**
   * Handle window resize - recalculate sizing and reposition
   */
  onResize(): void {
    if (this.cellContainers.size === 0) return;

    // Recalculate responsive sizing
    this.calculateResponsiveSizing();

    // Update all cell positions and sizes
    const diameter = this.currentCellDiameter;
    const gap = this.currentCellGap;
    const step = diameter + gap;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        const container = this.cellContainers.get(idx);

        if (container) {
          // Update position
          container.position.x = x * step + step / 2;
          container.position.y = y * step + step / 2;

          // Update cell size
          this.updateCellSize(container, diameter);
        }
      }
    }

    // Redraw synapse lines
    this.drawSynapses();

    // Re-center the grid
    this.centerGrid();

    console.log('[BattleRenderer] Resized for new window dimensions');
  }

  /**
   * Update cell graphics size
   */
  private updateCellSize(container: PIXI.Container, diameter: number): void {
    const cell = (container as any).cellGraphics as PIXI.Graphics;
    const glow = (container as any).glowGraphics as PIXI.Graphics;

    if (!cell || !glow) return;

    const radius = diameter / 2;
    const gap = this.currentCellGap;

    // Clear and redraw
    cell.clear();
    glow.clear();

    // Get current cell value from grid
    const x = Math.floor(container.position.x / (diameter + gap));
    const y = Math.floor(container.position.y / (diameter + gap));
    const idx = y * this.gridWidth + x;
    const value = this.currentGrid ? this.currentGrid[idx] : 0;

    if (value === 0) {
      cell.beginFill(this.COLORS.empty, 1);
      cell.drawCircle(0, 0, radius);
      cell.endFill();

      glow.beginFill(this.COLORS.empty, 0.3);
      glow.drawCircle(0, 0, radius + 2);
      glow.endFill();
    } else if (value === 1) {
      const pulse = this.getPulseValue();
      cell.beginFill(this.COLORS.virusA, 1);
      cell.drawCircle(0, 0, radius * pulse);
      cell.endFill();

      glow.beginFill(this.COLORS.virusA, 0.8);
      glow.drawCircle(0, 0, radius * pulse + 5);
      glow.endFill();
    } else if (value === 2) {
      const pulse = this.getPulseValue();
      cell.beginFill(this.COLORS.virusB, 1);
      cell.drawCircle(0, 0, radius * pulse);
      cell.endFill();

      glow.beginFill(this.COLORS.virusB, 0.8);
      glow.drawCircle(0, 0, radius * pulse + 5);
      glow.endFill();
    }
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

      // Hide defense rings for empty cells
      this.updateDefenseRings(container, 0, 0);
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

      // Update defense shield rings
      this.updateDefenseRings(container, this.paramsA?.defense || 0, 1);
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

      // Update defense shield rings
      this.updateDefenseRings(container, this.paramsB?.defense || 0, 2);
    }
  }

  /**
   * Set virus parameters for defense visualization
   */
  setVirusParams(paramsA: { defense: number }, paramsB: { defense: number }): void {
    this.paramsA = paramsA;
    this.paramsB = paramsB;
    console.log('[BattleRenderer] Virus params set:', { 
      paramsA: this.paramsA, 
      paramsB: this.paramsB 
    });

    // Refresh current grid visualization if exists
    if (this.currentGrid) {
      this.updateGrid(this.currentGrid);
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
