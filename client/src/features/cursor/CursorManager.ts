/**
 * CursorManager.ts
 * Управление курсорами игроков
 */

import * as PIXI from 'pixi.js';
import { PlayerSchema } from '../types/schema';

export interface CursorCallbacks {
  onCursorClicked?: (playerId: string) => void;
  onCursorMoved?: (playerId: string, x: number, y: number) => void;
}

export class CursorManager {
  private cursors: Map<string, PIXI.Sprite> = new Map();
  private labels: Map<string, PIXI.Text> = new Map();
  private app: PIXI.Application;
  private callbacks: CursorCallbacks = {};

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  createCursor(playerId: string, player: PlayerSchema): void {
    // Create cursor sprite
    const cursor = new PIXI.Sprite(PIXI.Texture.WHITE);
    cursor.tint = player.color;
    cursor.width = 20;
    cursor.height = 20;
    cursor.x = player.x;
    cursor.y = player.y;
    cursor.eventMode = 'static';
    cursor.on('pointertap', () => {
      if (this.callbacks.onCursorClicked) {
        this.callbacks.onCursorClicked(playerId);
      }
    });

    // Create label
    const label = new PIXI.Text(player.name || `Player ${playerId.substring(0, 4)}`, {
      fontFamily: 'Courier New',
      fontSize: 12,
      fill: player.color,
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = player.x;
    label.y = player.y - 25;

    this.cursors.set(playerId, cursor);
    this.labels.set(playerId, label);

    this.app.stage.addChild(cursor);
    this.app.stage.addChild(label);
  }

  updateCursor(playerId: string, x: number, y: number): void {
    const cursor = this.cursors.get(playerId);
    const label = this.labels.get(playerId);

    if (cursor) {
      cursor.x = x;
      cursor.y = y;
    }

    if (label) {
      label.x = x;
      label.y = y - 25;
    }

    if (this.callbacks.onCursorMoved) {
      this.callbacks.onCursorMoved(playerId, x, y);
    }
  }

  removeCursor(playerId: string): void {
    const cursor = this.cursors.get(playerId);
    const label = this.labels.get(playerId);

    if (cursor) {
      this.app.stage.removeChild(cursor);
      cursor.destroy();
      this.cursors.delete(playerId);
    }

    if (label) {
      this.app.stage.removeChild(label);
      label.destroy();
      this.labels.delete(playerId);
    }
  }

  getAllCursors(): Map<string, PIXI.Sprite> {
    return this.cursors;
  }

  setCallbacks(callbacks: CursorCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy(): void {
    // Clean up all cursors
    this.cursors.forEach(cursor => {
      this.app.stage.removeChild(cursor);
      cursor.destroy();
    });
    this.cursors.clear();

    this.labels.forEach(label => {
      this.app.stage.removeChild(label);
      label.destroy();
    });
    this.labels.clear();
  }
}