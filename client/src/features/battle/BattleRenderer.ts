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
  
  private gridWidth: number = 64;
  private gridHeight: number = 36;
  private totalCells: number = this.gridWidth * this.gridHeight;
  
  private readonly COLORS = {
    empty: 0x1a1a1a,
    virusA: 0xff0000,
    virusB: 0x0000ff,
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
      cellDiameter: 15,
      cellGap: 2,
      pulseSpeed: 2000,
      contestedFlickerSpeed: 200,
      ...config
    };

    this.container.zIndex = 100;
    this.container.alpha = 0;
    this.container.visible = false;

    stage.addChild(this.container);
    console.log('[BattleRenderer] Created');
  }

  initGrid(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.totalCells = width * height;

    console.log(`[BattleRenderer] Init grid: ${width}×${height} = ${this.totalCells} cells`);

    this.cellContainers.forEach(container => {
      this.container.removeChild(container);
      container.destroy({ children: true });
    });
    this.cellContainers.clear();
    this.linesContainer.clear();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const container = this.createCellContainer(x, y);
        this.cellContainers.set(idx, container);
        this.container.addChild(container);
      }
    }

    this.drawSynapses();
    this.centerGrid();
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

    this.cellContainers.forEach((container, idx) => {
      const x = idx % this.gridWidth;
      const y = Math.floor(idx / this.gridWidth);

      container.position.x = x * step + step / 2;
      container.position.y = y * step + step / 2;
    });

    this.container.position.x = (window.innerWidth - gridWidthPx) / 2 + step / 2;
    this.container.position.y = (window.innerHeight - gridHeightPx) / 2 + step / 2;
  }

  updateGrid(grid: number[]): void {
    if (grid.length !== this.totalCells) {
      console.error('[BattleRenderer] Grid size mismatch');
      return;
    }

    for (let i = 0; i < this.totalCells; i++) {
      const cellValue = grid[i];
      const container = this.cellContainers.get(i);
      
      if (container) {
        this.updateCell(container, cellValue);
      }
    }
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

      glow.beginFill(this.COLORS.virusA, 0.5);
      glow.drawCircle(0, 0, radius * pulse + 3);
      glow.endFill();
    } else if (value === 2) {
      const pulse = this.getPulseValue();
      cell.beginFill(this.COLORS.virusB, 1);
      cell.drawCircle(0, 0, radius * pulse);
      cell.endFill();

      glow.beginFill(this.COLORS.virusB, 0.5);
      glow.drawCircle(0, 0, radius * pulse + 3);
      glow.endFill();
    }
  }

  private getPulseValue(): number {
    const time = Date.now() % this.config.pulseSpeed;
    const normalized = time / this.config.pulseSpeed;
    return 1 + 0.1 * Math.sin(normalized * Math.PI * 2);
  }

  show(): void {
    this.container.alpha = 1;
    this.container.visible = true;
    console.log('[BattleRenderer] Show');
  }

  hide(): void {
    this.container.alpha = 0;
    this.container.visible = false;
    console.log('[BattleRenderer] Hide');
  }

  update(delta: number): void {
    // Animation updates can go here
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
