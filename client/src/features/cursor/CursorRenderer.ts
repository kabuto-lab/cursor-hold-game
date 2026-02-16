import * as PIXI from 'pixi.js';
import { CursorManager } from './CursorManager';

/**
 * Рендерер курсоров
 * Отрисовывает удалённые курсоры на сцене с интерполяцией
 */
export class CursorRenderer {
  private stage: PIXI.Container;
  private cursorManager: CursorManager;
  private cursorGraphics: Map<string, PIXI.Graphics> = new Map();
  private cursorPositions: Map<string, { x: number; y: number }> = new Map();
  private readonly lerpFactor: number = 0.3; // Коэффициент интерполяции

  constructor(stage: PIXI.Container, cursorManager: CursorManager) {
    this.stage = stage;
    this.cursorManager = cursorManager;

    this.startRendering();
  }

  /**
   * Генерировать цвет из playerId (детерминированно)
   */
  private generateColorFromId(playerId: string): number {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Генерируем яркий цвет (избегаем тёмных)
    const r = ((hash >> 16) & 0x7F) + 128;
    const g = ((hash >> 8) & 0x7F) + 128;
    const b = (hash & 0x7F) + 128;
    return (r << 16) + (g << 8) + b;
  }

  /**
   * Создать Graphics для курсора игрока
   */
  private createCursorGraphics(playerId: string): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const color = this.generateColorFromId(playerId);

    // Круг 15px
    graphics.circle(0, 0, 7.5);
    graphics.fill({ color });

    // Стрелка (треугольник)
    const arrowSize = 8;
    graphics.moveTo(0, -10);
    graphics.lineTo(-arrowSize / 2, -10 - arrowSize);
    graphics.lineTo(arrowSize / 2, -10 - arrowSize);
    graphics.closePath();
    graphics.fill({ color });

    // Белая обводка для видимости
    graphics.stroke({ width: 2, color: 0xFFFFFF });

    this.stage.addChild(graphics);
    return graphics;
  }

  /**
   * Обновить или создать курсор для игрока
   */
  private updateCursor(playerId: string, targetX: number, targetY: number): void {
    let graphics = this.cursorGraphics.get(playerId);

    if (!graphics) {
      graphics = this.createCursorGraphics(playerId);
      this.cursorGraphics.set(playerId, graphics);
      // Инициализируем текущую позицию целевой
      this.cursorPositions.set(playerId, { x: targetX, y: targetY });
    }

    const currentPos = this.cursorPositions.get(playerId);
    if (currentPos) {
      // Интерполяция (lerp) для плавности
      const newX = currentPos.x + (targetX - currentPos.x) * this.lerpFactor;
      const newY = currentPos.y + (targetY - currentPos.y) * this.lerpFactor;

      graphics.x = newX;
      graphics.y = newY;

      // Обновляем текущую позицию
      currentPos.x = newX;
      currentPos.y = newY;
    }
  }

  /**
   * Удалить курсор игрока
   */
  private removeCursor(playerId: string): void {
    const graphics = this.cursorGraphics.get(playerId);
    if (graphics) {
      this.stage.removeChild(graphics);
      graphics.destroy({ children: true });
      this.cursorGraphics.delete(playerId);
      this.cursorPositions.delete(playerId);
    }
  }

  /**
   * Запустить цикл рендеринга
   */
  private startRendering(): void {
    const renderLoop = () => {
      const remoteCursors = this.cursorManager.getAllRemoteCursors();
      const activePlayerIds = new Set(remoteCursors.keys());

      // Обновляем существующие курсоры
      for (const [playerId, pos] of remoteCursors.entries()) {
        this.updateCursor(playerId, pos.x, pos.y);
      }

      // Удаляем курсоры игроков, которые больше не активны
      for (const playerId of this.cursorGraphics.keys()) {
        if (!activePlayerIds.has(playerId)) {
          this.removeCursor(playerId);
        }
      }

      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  /**
   * Очистить все курсоры
   */
  clear(): void {
    for (const playerId of this.cursorGraphics.keys()) {
      this.removeCursor(playerId);
    }
  }
}
