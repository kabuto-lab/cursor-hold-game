/**
 * BattleManager — управляет состоянием битвы вирусов
 */

export type BattleStateType = 'idle' | 'preparing' | 'running' | 'ended';

export type BattleState = 
  | { type: 'idle' }
  | { type: 'preparing'; startTime: number }
  | { type: 'running'; startTime: number; tick: number }
  | { type: 'ended'; winner: 'A' | 'B' | 'draw'; virusACount: number; virusBCount: number };

export interface BattleGridData {
  grid: number[];
  width: number;
  height: number;
}

export class BattleManager {
  private state: BattleState = { type: 'idle' };
  private gridData: BattleGridData | null = null;
  private onStateChangeCallback?: (state: BattleState) => void;
  private onGridUpdateCallback?: (grid: number[]) => void;

  constructor() {
    console.log('[BattleManager] Created');
  }

  /**
   * Получить текущее состояние
   */
  getState(): BattleState {
    return this.state;
  }

  /**
   * Получить данные сетки
   */
  getGridData(): BattleGridData | null {
    return this.gridData;
  }

  /**
   * Установить callback при изменении состояния
   */
  setOnStateChange(callback: (state: BattleState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Установить callback при обновлении сетки
   */
  setOnGridUpdate(callback: (grid: number[]) => void): void {
    this.onGridUpdateCallback = callback;
  }

  /**
   * Обработать начало битвы
   */
  onBattleStarted(data: { battleGrid: number[]; width: number; height: number }): void {
    console.log('[BattleManager] Battle started');
    
    this.gridData = {
      grid: data.battleGrid,
      width: data.width,
      height: data.height
    };

    this.state = {
      type: 'running',
      startTime: Date.now(),
      tick: 0
    };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }

    if (this.onGridUpdateCallback && this.gridData) {
      this.onGridUpdateCallback(this.gridData.grid);
    }
  }

  /**
   * Обработать тик битвы
   */
  onBattleTick(data: { battleGrid: number[]; tick: number }): void {
    if (this.state.type !== 'running') return;

    this.gridData = {
      grid: data.battleGrid,
      width: this.gridData?.width || 64,
      height: this.gridData?.height || 36
    };

    this.state = {
      ...this.state,
      tick: data.tick
    };

    if (this.onGridUpdateCallback && this.gridData) {
      this.onGridUpdateCallback(this.gridData.grid);
    }
  }

  /**
   * Обработать окончание битвы
   */
  onBattleEnded(data: { 
    winner: 'A' | 'B' | 'draw';
    virusACount: number; 
    virusBCount: number 
  }): void {
    console.log('[BattleManager] Battle ended:', data.winner);

    this.state = {
      type: 'ended',
      winner: data.winner,
      virusACount: data.virusACount,
      virusBCount: data.virusBCount
    };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  /**
   * Сбросить состояние
   */
  reset(): void {
    this.state = { type: 'idle' };
    this.gridData = null;

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  /**
   * Проверить, идёт ли битва
   */
  isRunning(): boolean {
    return this.state.type === 'running';
  }

  /**
   * Проверить, завершена ли битва
   */
  isEnded(): boolean {
    return this.state.type === 'ended';
  }
}
