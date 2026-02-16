/**
 * BattleRenderer.ts
 * Renders battle graphics using PixiJS (no business logic)
 */

import * as PIXI from 'pixi.js';
import { BattleState } from './BattleManager';

export interface BattleRendererOptions {
  gridSize?: { width: number; height: number };
  cellSize?: number;
  position?: { x: number; y: number };
}

export class BattleRenderer {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private battleGrid: PIXI.Graphics | null = null;
  private options: BattleRendererOptions;
  private currentState: BattleState | null = null;

  constructor(app: PIXI.Application, options: BattleRendererOptions = {}) {
    this.app = app;
    this.container = new PIXI.Container();
    this.options = {
      gridSize: { width: 20, height: 32 },
      cellSize: 16,
      position: { x: 0, y: 0 },
      ...options
    };

    this.app.stage.addChild(this.container);
  }

  setOptions(options: BattleRendererOptions): void {
    this.options = { ...this.options, ...options };
  }

  update(state: BattleState): void {
    this.currentState = state;

    // Clear previous visualization
    this.clear();

    // Render based on state
    switch (state.type) {
      case 'running':
        this.renderBattleGrid();
        break;
      case 'preparing':
        this.renderPreparation();
        break;
      case 'ended':
        this.renderResults(state.winner);
        break;
      case 'idle':
        // Nothing to render in idle state
        break;
    }
  }

  private renderBattleGrid(): void {
    if (!this.options.gridSize || !this.options.cellSize) return;

    const { width, height } = this.options.gridSize;
    const cellSize = this.options.cellSize;

    // Create grid container
    this.battleGrid = new PIXI.Graphics();
    this.battleGrid.x = this.options.position?.x || 0;
    this.battleGrid.y = this.options.position?.y || 0;

    // Draw grid background
    this.battleGrid.beginFill(0x000000, 0.3);
    this.battleGrid.drawRect(0, 0, width * cellSize, height * cellSize);
    this.battleGrid.endFill();

    // Draw grid lines
    this.battleGrid.lineStyle(1, 0x333333);
    for (let x = 0; x <= width; x++) {
      this.battleGrid.moveTo(x * cellSize, 0);
      this.battleGrid.lineTo(x * cellSize, height * cellSize);
    }
    for (let y = 0; y <= height; y++) {
      this.battleGrid.moveTo(0, y * cellSize);
      this.battleGrid.lineTo(width * cellSize, y * cellSize);
    }

    // Example: Draw some sample cells (in a real implementation, this would come from battle data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Randomly place some "virus" cells for demonstration
        if (Math.random() < 0.05) { // 5% chance of a cell
          const cellValue = Math.floor(Math.random() * 3); // 0=empty, 1=playerA, 2=playerB
          
          let color: number;
          switch (cellValue) {
            case 1: color = 0xff0000; break; // Red for player A
            case 2: color = 0x0000ff; break; // Blue for player B
            default: color = 0x00ff00; break; // Green for empty
          }

          this.battleGrid.beginFill(color, 0.8);
          this.battleGrid.drawRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
          this.battleGrid.endFill();
        }
      }
    }

    this.container.addChild(this.battleGrid);
  }

  private renderPreparation(): void {
    // Render preparation state visualization
    const prepText = new PIXI.Text({
      text: 'BATTLE PREPARATION',
      style: {
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: 0xffff00,
        align: 'center',
      }
    });
    prepText.anchor.set(0.5);
    prepText.x = (this.options.gridSize?.width || 20) * (this.options.cellSize || 16) / 2;
    prepText.y = (this.options.gridSize?.height || 32) * (this.options.cellSize || 16) / 2;
    
    this.container.addChild(prepText);
  }

  private renderResults(winner: 'A' | 'B' | 'draw'): void {
    // Render battle results visualization
    let resultText: string;
    let textColor: number;
    
    switch (winner) {
      case 'A': 
        resultText = 'PLAYER A WINS!';
        textColor = 0xff0000;
        break;
      case 'B': 
        resultText = 'PLAYER B WINS!';
        textColor = 0x0000ff;
        break;
      default: 
        resultText = 'DRAW!';
        textColor = 0xffff00;
    }

    const result = new PIXI.Text({
      text: resultText,
      style: {
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: textColor,
        align: 'center',
      }
    });
    result.anchor.set(0.5);
    result.x = (this.options.gridSize?.width || 20) * (this.options.cellSize || 16) / 2;
    result.y = (this.options.gridSize?.height || 32) * (this.options.cellSize || 16) / 2;
    
    this.container.addChild(result);
  }

  private clear(): void {
    if (this.battleGrid) {
      this.container.removeChild(this.battleGrid);
      this.battleGrid.destroy();
      this.battleGrid = null;
    }

    // Remove all children from container
    this.container.removeChildren().forEach(child => child.destroy());
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  destroy(): void {
    this.clear();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy();
  }
}