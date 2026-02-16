import { InputManager } from '../../core/InputManager';
import { NetworkManager } from '../../core/NetworkManager';

/**
 * Менеджер курсоров
 * Отправляет позицию локального курсора и получает обновления удалённых
 */
export class CursorManager {
  private inputManager: InputManager;
  private networkManager: NetworkManager;
  private lastSendTime: number = 0;
  private readonly sendInterval: number = 33; // ~30 FPS для сети

  // Хранилище позиций удалённых курсоров: playerId -> {x, y}
  private remoteCursors: Map<string, { x: number; y: number }> = new Map();

  // Позиция локального курсора (для отладки)
  private localPosition: { x: number; y: number } = { x: 0, y: 0 };

  // Callback для обновления UI
  public onLocalCursorUpdate?: (x: number, y: number) => void;
  public onRemoteCursorUpdate?: (playerId: string, x: number, y: number) => void;

  constructor(inputManager: InputManager, networkManager: NetworkManager) {
    this.inputManager = inputManager;
    this.networkManager = networkManager;

    this.setupNetworkListeners();
    this.startSending();
  }

  /**
   * Настроить сетевые слушатели
   */
  private setupNetworkListeners(): void {
    console.log('[CursorManager] setupNetworkListeners called');
    // Слушаем обновления курсоров от других игроков
    this.networkManager.onMessage('cursorUpdate', (data: { playerId: string; x: number; y: number }) => {
      console.log('[CursorManager] Received cursorUpdate:', data);
      if (data.playerId && typeof data.x === 'number' && typeof data.y === 'number') {
        this.remoteCursors.set(data.playerId, { x: data.x, y: data.y });
        console.log('[CursorManager] Updated cursor for playerId:', data.playerId, 'Total cursors:', this.remoteCursors.size);
        
        // Вызываем callback для рендерера
        if (this.onRemoteCursorUpdate) {
          this.onRemoteCursorUpdate(data.playerId, data.x, data.y);
        }
      }
    });
  }

  /**
   * Начать периодическую отправку позиции курсора
   */
  private startSending(): void {
    const sendLoop = () => {
      const now = Date.now();
      if (now - this.lastSendTime >= this.sendInterval) {
        this.sendCursorUpdate();
        this.lastSendTime = now;
      }
      requestAnimationFrame(sendLoop);
    };
    requestAnimationFrame(sendLoop);
  }

  /**
   * Отправить текущую позицию курсора
   */
  private sendCursorUpdate(): void {
    const pos = this.inputManager.getMousePosition();
    this.localPosition = { x: pos.x, y: pos.y };
    console.log('[CursorManager] Sending cursor update:', pos);
    this.networkManager.sendCursorUpdate(pos.x, pos.y);

    // Вызываем callback для UI
    if (this.onLocalCursorUpdate) {
      this.onLocalCursorUpdate(pos.x, pos.y);
    }
  }

  /**
   * Получить позицию удалённого курсора по playerId
   */
  getRemoteCursor(playerId: string): { x: number; y: number } | null {
    return this.remoteCursors.get(playerId) || null;
  }

  /**
   * Получить все удалённые курсоры
   */
  getAllRemoteCursors(): Map<string, { x: number; y: number }> {
    return new Map(this.remoteCursors);
  }

  /**
   * Получить локальную позицию курсора
   */
  getLocalPosition(): { x: number; y: number } {
    return { ...this.localPosition };
  }

  /**
   * Удалить курсор игрока (когда игрок покинул комнату)
   */
  removeRemoteCursor(playerId: string): void {
    this.remoteCursors.delete(playerId);
  }

  /**
   * Очистить все удалённые курсоры
   */
  clearRemoteCursors(): void {
    this.remoteCursors.clear();
  }
}
