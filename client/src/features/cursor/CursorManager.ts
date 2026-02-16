/**
 * CursorManager.ts
 * Manages player cursor data and state
 */

import { PlayerSchema } from '../../types/schema';

export interface CursorData {
  id: string;
  x: number;
  y: number;
  color: number;
  name: string;
  isHoldingHands: boolean;
  holdingHandsWith: string | null;
}

export interface CursorEvents {
  onCursorAdded?: (cursor: CursorData) => void;
  onCursorUpdated?: (cursor: CursorData) => void;
  onCursorRemoved?: (cursorId: string) => void;
  onCursorClicked?: (cursorId: string) => void;
}

export class CursorManager {
  private cursors: Map<string, CursorData> = new Map();
  private events: CursorEvents = {};

  constructor(events: CursorEvents = {}) {
    this.events = events;
  }

  setCursors(cursors: Map<string, CursorData>): void {
    this.cursors = cursors;
  }

  setEvents(events: CursorEvents): void {
    this.events = events;
  }

  addOrUpdateCursor(player: PlayerSchema): void {
    const cursor: CursorData = {
      id: player.id,
      x: player.x,
      y: player.y,
      color: player.color,
      name: player.name,
      isHoldingHands: player.isHoldingHands,
      holdingHandsWith: player.holdingHandsWith || null,
    };

    const existing = this.cursors.has(player.id);
    this.cursors.set(player.id, cursor);

    if (existing && this.events.onCursorUpdated) {
      this.events.onCursorUpdated(cursor);
    } else if (!existing && this.events.onCursorAdded) {
      this.events.onCursorAdded(cursor);
    }
  }

  removeCursor(playerId: string): void {
    if (this.cursors.has(playerId)) {
      this.cursors.delete(playerId);
      if (this.events.onCursorRemoved) {
        this.events.onCursorRemoved(playerId);
      }
    }
  }

  getCursor(playerId: string): CursorData | undefined {
    return this.cursors.get(playerId);
  }

  getAllCursors(): CursorData[] {
    return Array.from(this.cursors.values());
  }

  updateCursorPosition(playerId: string, x: number, y: number): void {
    const cursor = this.cursors.get(playerId);
    if (cursor) {
      cursor.x = x;
      cursor.y = y;
      if (this.events.onCursorUpdated) {
        this.events.onCursorUpdated(cursor);
      }
    }
  }

  handleCursorClick(playerId: string): void {
    if (this.events.onCursorClicked) {
      this.events.onCursorClicked(playerId);
    }
  }

  destroy(): void {
    this.cursors.clear();
    this.events = {};
  }
}