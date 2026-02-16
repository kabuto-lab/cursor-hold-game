/**
 * CursorRenderer.ts
 * Renders player cursors using PixiJS
 */

import * as PIXI from 'pixi.js';
import { CursorData } from './CursorManager';

export interface CursorRendererOptions {
  cursorSize?: number;
  labelVisible?: boolean;
  linkVisible?: boolean;
}

export class CursorRenderer {
  private app: PIXI.Application;
  private cursors: Map<string, PIXI.Sprite> = new Map();
  private labels: Map<string, PIXI.Text> = new Map();
  private links: Map<string, PIXI.Graphics> = new Map(); // key: player1Id-player2Id
  private options: CursorRendererOptions;
  private textures: Map<number, PIXI.Texture> = new Map();

  constructor(app: PIXI.Application, options: CursorRendererOptions = {}) {
    this.app = app;
    this.options = {
      cursorSize: 20,
      labelVisible: true,
      linkVisible: true,
      ...options
    };
  }

  setOptions(options: CursorRendererOptions): void {
    this.options = { ...this.options, ...options };
  }

  addCursor(cursorData: CursorData): void {
    // Create cursor sprite
    const texture = this.getOrCreateTexture(cursorData.color);
    const sprite = PIXI.Sprite.from(texture);
    sprite.anchor.set(0.5);
    sprite.x = cursorData.x;
    sprite.y = cursorData.y;
    sprite.visible = true;
    
    this.cursors.set(cursorData.id, sprite);
    this.app.stage.addChild(sprite);

    // Create label
    if (this.options.labelVisible) {
      const label = new PIXI.Text({
        text: cursorData.name,
        style: {
          fontFamily: 'Courier New',
          fontSize: 12,
          fill: 0x00ff00,
          align: 'center',
        }
      });
      label.anchor.set(0.5);
      label.x = cursorData.x;
      label.y = cursorData.y - 25;
      label.visible = true;
      
      this.labels.set(cursorData.id, label);
      this.app.stage.addChild(label);
    }
  }

  updateCursor(cursorData: CursorData): void {
    const sprite = this.cursors.get(cursorData.id);
    if (sprite) {
      sprite.x = cursorData.x;
      sprite.y = cursorData.y;
    }

    const label = this.labels.get(cursorData.id);
    if (label) {
      label.x = cursorData.x;
      label.y = cursorData.y - 25;
    }
  }

  removeCursor(cursorId: string): void {
    const sprite = this.cursors.get(cursorId);
    if (sprite) {
      this.app.stage.removeChild(sprite);
      sprite.destroy();
      this.cursors.delete(cursorId);
    }

    const label = this.labels.get(cursorId);
    if (label) {
      this.app.stage.removeChild(label);
      label.destroy();
      this.labels.delete(cursorId);
    }

    // Remove any links associated with this cursor
    const linksToRemove: string[] = [];
    this.links.forEach((_, key) => {
      if (key.startsWith(`${cursorId}-`) || key.endsWith(`-${cursorId}`)) {
        linksToRemove.push(key);
      }
    });

    linksToRemove.forEach(linkKey => {
      this.removeLink(linkKey);
    });
  }

  updateLinks(cursors: CursorData[]): void {
    // Clear existing links
    this.links.forEach(link => {
      if (link.parent) {
        link.parent.removeChild(link);
      }
      link.destroy();
    });
    this.links.clear();

    // Create links between holding hands
    const holdingPairs = new Set<string>();
    
    cursors.forEach(cursor => {
      if (cursor.isHoldingHands && cursor.holdingHandsWith) {
        // Create a consistent key regardless of order
        const pairKey = [cursor.id, cursor.holdingHandsWith].sort().join('-');
        holdingPairs.add(pairKey);
      }
    });

    holdingPairs.forEach(pairKey => {
      const [id1, id2] = pairKey.split('-');
      this.createLink(id1, id2);
    });
  }

  private createLink(player1Id: string, player2Id: string): void {
    const cursor1 = this.cursors.get(player1Id);
    const cursor2 = this.cursors.get(player2Id);

    if (!cursor1 || !cursor2) return;

    const link = new PIXI.Graphics();
    const linkKey = `${player1Id}-${player2Id}`;
    
    // Draw a line between cursors
    link.lineStyle(2, 0x00ff00);
    link.moveTo(cursor1.x, cursor1.y);
    link.lineTo(cursor2.x, cursor2.y);
    
    this.links.set(linkKey, link);
    this.app.stage.addChild(link);
  }

  private removeLink(linkKey: string): void {
    const link = this.links.get(linkKey);
    if (link) {
      if (link.parent) {
        link.parent.removeChild(link);
      }
      link.destroy();
      this.links.delete(linkKey);
    }
  }

  private getOrCreateTexture(color: number): PIXI.Texture {
    if (!this.textures.has(color)) {
      // Create a simple circle texture
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color);
      graphics.drawCircle(0, 0, this.options.cursorSize! / 2);
      graphics.endFill();
      
      const canvas = document.createElement('canvas');
      canvas.width = this.options.cursorSize!;
      canvas.height = this.options.cursorSize!;
      const ctx = canvas.getContext('2d')!;
      
      // Draw the cursor shape
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(this.options.cursorSize! / 2, this.options.cursorSize! / 2, this.options.cursorSize! / 2, 0, Math.PI * 2);
      ctx.fill();
      
      const texture = PIXI.Texture.from(canvas);
      this.textures.set(color, texture);
    }
    
    return this.textures.get(color)!;
  }

  updateAllCursors(cursors: CursorData[]): void {
    // Update existing cursors
    cursors.forEach(cursor => {
      if (this.cursors.has(cursor.id)) {
        this.updateCursor(cursor);
      } else {
        this.addCursor(cursor);
      }
    });

    // Remove deleted cursors
    const existingIds = new Set(cursors.map(c => c.id));
    this.cursors.forEach((_, id) => {
      if (!existingIds.has(id)) {
        this.removeCursor(id);
      }
    });
  }

  setVisible(visible: boolean): void {
    this.cursors.forEach(cursor => cursor.visible = visible);
    this.labels.forEach(label => label.visible = visible);
  }

  destroy(): void {
    // Destroy all cursors
    this.cursors.forEach(sprite => {
      if (sprite.parent) sprite.parent.removeChild(sprite);
      sprite.destroy();
    });
    this.cursors.clear();

    // Destroy all labels
    this.labels.forEach(label => {
      if (label.parent) label.parent.removeChild(label);
      label.destroy();
    });
    this.labels.clear();

    // Destroy all links
    this.links.forEach(link => {
      if (link.parent) link.parent.removeChild(link);
      link.destroy();
    });
    this.links.clear();

    // Destroy textures
    this.textures.forEach(texture => texture.destroy());
    this.textures.clear();
  }
}